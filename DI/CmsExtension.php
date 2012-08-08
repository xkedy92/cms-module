<?php

/**
 * This file is part of the Venne:CMS (https://github.com/Venne)
 *
 * Copyright (c) 2011, 2012 Josef Kříž (http://www.josef-kriz.cz)
 *
 * For the full copyright and license information, please view
 * the file license.txt that was distributed with this source code.
 */

namespace CmsModule\DI;

use Venne;
use Venne\Config\CompilerExtension;
use Nette\Application\Routers\Route;

/**
 * @author Josef Kříž <pepakriz@gmail.com>
 */
class CmsExtension extends CompilerExtension
{

	public $defaults = array(
		'stopwatch' => array(
			'debugger' => NULL
		),

	);


	/**
	 * Processes configuration data. Intended to be overridden by descendant.
	 * @return void
	 */
	public function loadConfiguration()
	{
		parent::loadConfiguration();
		$container = $this->getContainerBuilder();
		$config = $this->getConfig($this->defaults);

		$container->addDependency($container->parameters["tempDir"] . "/installed");

		// http
		$httpResponse = $container->getDefinition('httpResponse');
		foreach ($httpResponse->setup as $setup) {
			if ($setup->entity == 'setHeader' && $setup->arguments[0] == 'X-Powered-By') {
				$httpResponse->addSetup('setHeader', array('X-Powered-By', $setup->arguments[1] . ' && Venne:CMS'));
			}
		}

		// Application
		$application = $container->getDefinition('application');
		$application->addSetup('$service->errorPresenter = ?', $container->parameters['website']['errorPresenter']);

		//$container->addDefinition("authorizatorFactory")
		//	->setFactory("CmsModule\Security\AuthorizatorFactory")
		//	->setAutowired(false);

		//$container->addDefinition("authorizator")
		//	->setClass("Nette\Security\Permission")
		//	->setFactory("@authorizatorFactory::getCurrentPermissions");

		$container->addDefinition("authenticator")
			->setClass("Venne\Security\Authenticator", array("%administration.login.name%", "%administration.login.password%"));

		// detect prefix
		$prefix = $container->parameters["website"]["routePrefix"];
		$adminPrefix = $container->parameters["administration"]["routePrefix"];
		$languages = $container->parameters["website"]["languages"];
		$prefix = str_replace("<lang>/", "<lang " . implode("|", $languages) . ">/", $prefix);

		// parameters
		$parameters = array();
		$parameters["lang"] = count($languages) > 1 || $container->parameters["website"]["routePrefix"] ? NULL : $container->parameters["website"]["defaultLanguage"];

		// Administration
		$container->addDefinition($this->prefix("adminRoute"))
			->setClass("CmsModule\Administration\Routes\Admin", array(($adminPrefix ? "$adminPrefix/" : "") . '<module>/<presenter>[/<action>[/<id>]]',
			array('module' => "Cms", 'presenter' => 'Default', 'action' => 'default',)
		))
			->setInternal(true)
			->setAutowired(false);

		$container->addDefinition($this->prefix("adminRouteList"))
			->setClass("CmsModule\Administration\Routes\RouteList", array("admin"))
			->addSetup('$service[] = ?', "@cms.adminRoute")
			->addTag("route", array("priority" => 9999999))
			->setAutowired(false);

		if (!file_exists($container->expand($container->parameters["tempDir"]) . "/installed")) {

			$container->addDefinition($this->prefix("basicRoute"))
				->setClass("Nette\Application\Routers\Route", array('<module>/<presenter>[/<action>[/<id>]]',
				array('module' => "Cms:Admin", 'presenter' => 'Default', 'action' => 'default',)
			))
				->addTag("route")
				->setAutowired(false);

			// CMS route
			$container->addDefinition($this->prefix("pageRoute"))
				->setClass("CmsModule\Content\Routes\Page", array('@cms.contentManager', '@cms.routeRepository', '@cms.languageRepository', $prefix, $parameters, $container->parameters["website"]["languages"], $container->parameters["website"]["defaultLanguage"])
			)
				->addTag("route", array("priority" => 100))
				->setAutowired(false);

		} else {
			// default route
			$container->addDefinition($this->prefix("defaultRoute"))
				->setClass("Nette\Application\Routers\Route", array('', array("presenter" => $container->parameters["website"]["defaultPresenter"], "lang" => NULL), Route::ONE_WAY))
				->addTag("route", array("priority" => -9999999))
				->setAutowired(false);
		}

		// config manager
		$container->addDefinition("configService")
			->setClass("CmsModule\Services\ConfigBuilder", array("%configDir%/config.neon"))
			->addTag("service");

		// debugger
		if ($config["stopwatch"]["debugger"]) {
			$container->getDefinition("user")
				->addSetup('Nette\Diagnostics\Debugger::$bar->addPanel(?)', array(new \Nette\DI\Statement('CmsModule\Panels\Stopwatch')));
		}
	}


	public function beforeCompile()
	{
		$this->registerContentTypes();
		$this->registerAdministrationPages();
	}


	protected function registerContentTypes()
	{
		$container = $this->getContainerBuilder();
		$manager = $container->getDefinition('cms.contentManager');

		foreach ($container->findByTag('contentType') as $item => $tags) {
			$arguments = $container->getDefinition($item)->factory->arguments;
			$entityName = '\\' . $arguments[0];
			$type = $entityName::getType();

			$container->getDefinition($item)->factory->arguments = array(
				0 => $type,
				1 => $tags['name'],
				2 => $arguments[0],
			);

			$manager->addSetup('$service->addContentType(?, ?, ?)', $type, $tags['name'], "@{$item}");
		}
	}


	protected function registerAdministrationPages()
	{
		/** @var $container \Nette\DI\ContainerBuilder */
		$container = $this->getContainerBuilder();
		$manager = $container->getDefinition('cms.administrationManager');

		foreach ($this->getSortedServices('administrationPage') as $item) {
			$tags = $container->getDefinition($item)->tags['administrationPage'];
			$manager->addSetup('addAdministrationPage', array($tags['name'], $tags['description'], $tags['category'], $tags['link'], "@{$item}"));
		}
	}
}
