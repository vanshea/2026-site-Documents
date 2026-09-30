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
	<link rel="icon" type="image/png" sizes="32x32" href="/fav-icon/fav-icon-32X32.png" media="(prefers-color-scheme: light)">
	<link rel="icon" type="image/png" sizes="48x48" href="/fav-icon/fav-icon-48X48-white.png" media="(prefers-color-scheme: dark)">
	<link rel="icon" href="/fav-icon/favicon.ico" sizes="any">
	<link rel="apple-touch-icon" sizes="180x180" href="/fav-icon/apple-touch-icon.png">
	<link rel="manifest" href="/fav-icon/site.webmanifest">
	<meta name="theme-color" content="#fffcf3">
	<script>
		(() => {
			const themes = new Set(["theme1", "theme3", "theme4", "theme5"]);
			const root = document.documentElement;
			let theme = themes.has(root.dataset.theme) ? root.dataset.theme : "theme4";

			try {
				const savedTheme = ["vsc-site-theme-v2", "vsc-site-theme"]
					.map((key) => window.localStorage.getItem(key))
					.find((value) => themes.has(value));

				if (savedTheme) {
					theme = savedTheme;
					window.localStorage.setItem("vsc-site-theme-v2", savedTheme);
				}
			} catch (error) {
				// Keep the WordPress default when storage is unavailable.
			}

			root.dataset.theme = theme;
			root.style.colorScheme =
				theme === "theme3" || (theme === "theme1" && window.matchMedia("(prefers-color-scheme: dark)").matches)
					? "dark"
					: "light";
		})();
	</script>
	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
	<?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>
<a class="skip-link" href="#top"><?php esc_html_e( 'Skip to main content', 'vanshea-creative-blog' ); ?></a>

<header class="site-header">
	<div class="header-inner">
		<a href="/" class="brand" aria-label="<?php esc_attr_e( 'Van Shea Creative home', 'vanshea-creative-blog' ); ?>">
			<img class="brand-logo" src="<?php echo esc_url( get_template_directory_uri() . '/assets/large-logo-horizontal.svg' ); ?>" alt="<?php esc_attr_e( 'Van Shea Creative', 'vanshea-creative-blog' ); ?>" width="215" height="61">
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
			<a href="/"><?php esc_html_e( 'Home', 'vanshea-creative-blog' ); ?></a>
			<a href="/work.html"><?php esc_html_e( 'Work', 'vanshea-creative-blog' ); ?></a>
			<a href="/case-studies/"><?php esc_html_e( 'Case Studies', 'vanshea-creative-blog' ); ?></a>
			<a href="/aidesign/"><?php esc_html_e( 'AI Design', 'vanshea-creative-blog' ); ?></a>
			<a href="/experience.html"><?php esc_html_e( 'Experience', 'vanshea-creative-blog' ); ?></a>
			<a href="<?php echo esc_url( home_url( '/' ) ); ?>" aria-current="page"><?php esc_html_e( 'Blog', 'vanshea-creative-blog' ); ?></a>
		</nav>
	</div>
</header>

<main id="top" class="site-main">
