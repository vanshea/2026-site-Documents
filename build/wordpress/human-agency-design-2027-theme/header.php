<!doctype html>
<html <?php language_attributes(); ?> data-theme="<?php echo esc_attr( had2027_default_theme() ); ?>">
<head>
<meta charset="<?php bloginfo( 'charset' ); ?>">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#fffcf3">
<link rel="icon" href="<?php echo esc_url( get_template_directory_uri() . '/assets/favicon.svg' ); ?>" type="image/svg+xml">
<link rel="apple-touch-icon" href="<?php echo esc_url( get_template_directory_uri() . '/assets/apple-touch-icon.png' ); ?>">
<script>
(() => {
  const available = ['theme1','theme3','theme4','theme5'];
  try {
    const saved = [localStorage.getItem('vsc-site-theme-v2'), localStorage.getItem('vsc-site-theme')].find(value => available.includes(value));
    if (saved) document.documentElement.dataset.theme = saved;
  } catch (error) {}
})();
</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<?php wp_head(); ?>
</head>
<body <?php body_class( 'had2027-blog' ); ?>>
<?php wp_body_open(); ?>
<a class="skip-link" href="#main"><?php esc_html_e( 'Skip to content', 'human-agency-design-2027' ); ?></a>
<header class="site-header">
  <div class="site-header-inner">
    <a class="brand" href="https://vanshea.com/" aria-label="Van Shea Creative home"><img class="brand-logo" src="<?php echo esc_url( get_template_directory_uri() . '/assets/home-2027/large-logo-horizontal.svg' ); ?>" width="215" height="61" alt="Van Shea Creative"></a>
    <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="siteNav"><span class="sr-only"><?php esc_html_e( 'Toggle navigation', 'human-agency-design-2027' ); ?></span><span aria-hidden="true">Menu</span></button>
    <nav id="siteNav" class="nav" aria-label="<?php esc_attr_e( 'Primary navigation', 'human-agency-design-2027' ); ?>">
      <?php if ( has_nav_menu( 'primary' ) ) : ?>
        <?php wp_nav_menu( array( 'theme_location' => 'primary', 'container' => false, 'menu_class' => 'nav-menu', 'items_wrap' => '<ul id="%1$s" class="%2$s">%3$s</ul>', 'depth' => 1 ) ); ?>
      <?php else : ?>
        <a href="https://vanshea.com/">Home</a>
        <a href="https://vanshea.com/work.html">Work</a>
        <a href="https://vanshea.com/case-studies/">Case Studies</a>
        <a href="https://vanshea.com/aidesign/">AI Design</a>
        <a href="https://vanshea.com/experience.html">Experience</a>
        <a href="<?php echo esc_url( home_url( '/' ) ); ?>" aria-current="page">Blog</a>
      <?php endif; ?>
    </nav>
  </div>
</header>
<main id="main" class="site-main">
