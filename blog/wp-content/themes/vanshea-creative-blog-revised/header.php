<?php
/**
 * Header template.
 *
 * @package VanSheaCreativeBlog
 */
?><!doctype html>
<html <?php language_attributes(); ?> data-theme="<?php echo esc_attr( vanshea_creative_blog_get_default_theme() ); ?>">
<head>
	<meta charset="<?php bloginfo( 'charset' ); ?>">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<meta name="color-scheme" content="light dark">
	<link rel="icon" href="/assets/icons/favicon.ico" sizes="any">
	<link rel="icon" href="/assets/icons/favicon.svg" type="image/svg+xml">
	<link rel="icon" href="/assets/icons/favicon-32x32.png" type="image/png" sizes="32x32">
	<link rel="icon" href="/assets/icons/favicon-16x16.png" type="image/png" sizes="16x16">
	<link rel="apple-touch-icon" href="/assets/icons/apple-touch-icon.png">
	<link rel="manifest" href="/assets/icons/site.webmanifest">
	<meta name="theme-color" content="#020319">
	<script src="/src/js/theme.js"></script>
	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
	<?php wp_head(); ?>
	<link rel="stylesheet" href="/src/styles/tokens.css">
	<link rel="stylesheet" href="/src/styles/blog-theme.css">
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>
<div class="bg-shape bg-shape-a"></div>
<div class="bg-shape bg-shape-b"></div>

<header class="site-header">
	<a href="<?php echo esc_url( home_url( '/' ) ); ?>" class="brand" aria-label="<?php esc_attr_e( 'Back to blog home', 'vanshea-creative-blog' ); ?>">
		<img class="brand-logo" src="<?php echo esc_url( home_url( '/assets/new-logo-mark.svg' ) ); ?>" alt="<?php esc_attr_e( 'Van Shea Creative', 'vanshea-creative-blog' ); ?>" width="56" height="56">
		<span class="brand-name"><?php esc_html_e( 'Van Shea Creative', 'vanshea-creative-blog' ); ?></span>
	</a>

	<button class="nav-toggle" type="button" aria-expanded="false" aria-controls="siteNav" aria-label="<?php esc_attr_e( 'Open navigation menu', 'vanshea-creative-blog' ); ?>">
		<span class="sr-only"><?php esc_html_e( 'Toggle navigation', 'vanshea-creative-blog' ); ?></span>
		<span class="nav-toggle-icon" aria-hidden="true">
			<span class="nav-toggle-bar"></span>
			<span class="nav-toggle-bar"></span>
			<span class="nav-toggle-bar"></span>
		</span>
	</button>

	<nav id="siteNav" class="nav" aria-label="<?php esc_attr_e( 'Primary navigation', 'vanshea-creative-blog' ); ?>">
		<a href="/#work">Work</a>
		<a href="/#writing">Writing</a>
		<a href="/about/">About</a>
		<a href="/#contact">Contact</a>
	</nav>
</header>

<main id="top" class="site-main">
