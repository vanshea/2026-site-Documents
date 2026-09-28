<?php
/** Theme setup and assets. */
function vsc_theme_setup() {
    add_theme_support( 'title-tag' );
    add_theme_support( 'automatic-feed-links' );
    add_theme_support( 'post-thumbnails' );
    add_theme_support( 'html5', array( 'search-form', 'comment-form', 'comment-list', 'gallery', 'caption', 'style', 'script' ) );
    add_theme_support( 'custom-logo', array( 'height' => 61, 'width' => 215, 'flex-height' => true, 'flex-width' => true ) );
    register_nav_menus( array( 'primary' => __( 'Primary navigation', 'van-shea-creative' ) ) );
}
add_action( 'after_setup_theme', 'vsc_theme_setup' );
function vsc_theme_assets() {
    $uri = get_template_directory_uri();
    $dir = get_template_directory();
    wp_enqueue_style( 'vsc-google-fonts', 'https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;500;600;700&family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display:ital@0;1&display=swap', array(), null );
    wp_enqueue_style( 'vsc-agency-home', $uri . '/assets/home-2027/agency-home.css', array( 'vsc-google-fonts' ), filemtime( $dir . '/assets/home-2027/agency-home.css' ) );
    wp_enqueue_style( 'vsc-agency-site', $uri . '/assets/home-2027/agency-site.css', array( 'vsc-agency-home' ), filemtime( $dir . '/assets/home-2027/agency-site.css' ) );
    wp_enqueue_style( 'vsc-theme', get_stylesheet_uri(), array( 'vsc-agency-site' ), filemtime( $dir . '/style.css' ) );
    wp_enqueue_script( 'vsc-agency-home', $uri . '/assets/home-2027/agency-home.js', array(), filemtime( $dir . '/assets/home-2027/agency-home.js' ), true );
}
add_action( 'wp_enqueue_scripts', 'vsc_theme_assets' );
