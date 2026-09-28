<!doctype html>
<html <?php language_attributes(); ?> data-theme="theme4">
<head>
<meta charset="<?php bloginfo( 'charset' ); ?>">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#fffcf3">
<link rel="icon" href="<?php echo esc_url( get_template_directory_uri() . '/assets/icons/favicon.svg' ); ?>" type="image/svg+xml">
<link rel="apple-touch-icon" href="<?php echo esc_url( get_template_directory_uri() . '/assets/icons/apple-touch-icon.png' ); ?>">
<?php wp_head(); ?>
</head>
<body <?php body_class( is_front_page() ? 'agency-home' : 'agency-site' ); ?>>
<?php wp_body_open(); ?>
<a class="skip" href="#main">Skip to main content</a>
<header class="home-header">
  <div class="container header-inner">
    <a class="home-brand" href="<?php echo esc_url( home_url( '/' ) ); ?>" aria-label="Van Shea Creative, Human Agency Design home">
      <img src="<?php echo esc_url( get_template_directory_uri() . '/assets/home-2027/large-logo-horizontal.svg' ); ?>" width="215" height="61" alt="Van Shea Creative">
    </a>
    <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="home-nav">Menu</button>
    <nav class="home-nav" id="home-nav" aria-label="Main navigation">
      <?php if ( has_nav_menu( 'primary' ) ) : ?>
        <?php wp_nav_menu( array( 'theme_location' => 'primary', 'container' => false, 'items_wrap' => '%3$s' ) ); ?>
      <?php else : ?>
        <a href="<?php echo esc_url( home_url( '/' ) ); ?>">Home</a>
        <a href="<?php echo esc_url( home_url( '/work/' ) ); ?>">Work</a>
        <a href="<?php echo esc_url( home_url( '/case-studies/' ) ); ?>">Case Studies</a>
        <a href="<?php echo esc_url( home_url( '/ai-design/' ) ); ?>">AI Design</a>
        <a href="<?php echo esc_url( home_url( '/experience/' ) ); ?>">Experience</a>
        <a href="https://vanshea.com/blog/">Blog</a>
      <?php endif; ?>
    </nav>
  </div>
</header>
