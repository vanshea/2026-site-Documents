<?php
/**
 * Blog-only theme setup for Human Agency Design 2027.
 * @package HumanAgencyDesign2027
 */
if ( ! defined( 'ABSPATH' ) ) { exit; }

function had2027_setup() {
    load_theme_textdomain( 'human-agency-design-2027', get_template_directory() . '/languages' );
    add_theme_support( 'title-tag' );
    add_theme_support( 'automatic-feed-links' );
    add_theme_support( 'post-thumbnails' );
    add_theme_support( 'responsive-embeds' );
    add_theme_support( 'align-wide' );
    add_theme_support( 'html5', array( 'search-form', 'comment-form', 'comment-list', 'gallery', 'caption', 'style', 'script' ) );
    register_nav_menus( array( 'primary' => __( 'Blog navigation', 'human-agency-design-2027' ) ) );
}
add_action( 'after_setup_theme', 'had2027_setup' );

function had2027_theme_choices() {
    return array(
        'theme1' => __( 'Clear', 'human-agency-design-2027' ),
        'theme3' => __( 'High Contrast', 'human-agency-design-2027' ),
        'theme4' => __( 'Bold', 'human-agency-design-2027' ),
        'theme5' => __( 'Wild', 'human-agency-design-2027' ),
    );
}
function had2027_sanitize_theme( $value ) {
    $choices = had2027_theme_choices();
    return isset( $choices[ $value ] ) ? $value : 'theme4';
}
function had2027_default_theme() {
    return had2027_sanitize_theme( get_theme_mod( 'had2027_default_theme', 'theme4' ) );
}
function had2027_sanitize_checkbox( $value ) { return (bool) $value; }
function had2027_customize( $wp_customize ) {
    $wp_customize->add_section( 'had2027_blog_options', array(
        'title' => __( 'Human Agency Design Blog', 'human-agency-design-2027' ),
        'priority' => 160,
    ) );
    $wp_customize->add_setting( 'had2027_default_theme', array(
        'default' => 'theme4', 'sanitize_callback' => 'had2027_sanitize_theme', 'transport' => 'refresh',
    ) );
    $wp_customize->add_control( 'had2027_default_theme', array(
        'label' => __( 'Default color theme', 'human-agency-design-2027' ),
        'section' => 'had2027_blog_options', 'type' => 'select', 'choices' => had2027_theme_choices(),
    ) );
    $wp_customize->add_setting( 'had2027_show_theme_switcher', array(
        'default' => true, 'sanitize_callback' => 'had2027_sanitize_checkbox', 'transport' => 'refresh',
    ) );
    $wp_customize->add_control( 'had2027_show_theme_switcher', array(
        'label' => __( 'Show theme selector in footer', 'human-agency-design-2027' ),
        'section' => 'had2027_blog_options', 'type' => 'checkbox',
    ) );
}
add_action( 'customize_register', 'had2027_customize' );

function had2027_assets() {
    $version = wp_get_theme()->get( 'Version' );
    wp_enqueue_style( 'had2027-fonts', 'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Serif+Display:ital@0;1&display=swap', array(), null );
    wp_enqueue_style( 'had2027-style', get_stylesheet_uri(), array( 'had2027-fonts' ), $version );
    wp_enqueue_script( 'had2027-script', get_template_directory_uri() . '/assets/theme.js', array(), $version, true );
}
add_action( 'wp_enqueue_scripts', 'had2027_assets' );
function had2027_excerpt_length() { return 30; }
add_filter( 'excerpt_length', 'had2027_excerpt_length' );
function had2027_excerpt_more() { return '…'; }
add_filter( 'excerpt_more', 'had2027_excerpt_more' );
function had2027_posted_on() { echo '<time datetime="' . esc_attr( get_the_date( DATE_W3C ) ) . '">' . esc_html( get_the_date() ) . '</time>'; }
function had2027_posted_by() { echo '<span class="byline">' . esc_html( get_the_author() ) . '</span>'; }
function had2027_post_image( $size = 'large', $class = '' ) {
    $post_id = get_the_ID();
    if ( has_post_thumbnail( $post_id ) ) {
        the_post_thumbnail( $size, array( 'class' => $class, 'loading' => 'lazy', 'decoding' => 'async' ) );
        return true;
    }
    $attachments = get_children( array( 'post_parent' => $post_id, 'post_type' => 'attachment', 'post_mime_type' => 'image', 'numberposts' => 1, 'orderby' => 'menu_order date', 'order' => 'ASC', 'fields' => 'ids' ) );
    if ( $attachments ) {
        echo wp_get_attachment_image( (int) reset( $attachments ), $size, false, array( 'class' => $class, 'loading' => 'lazy', 'decoding' => 'async' ) );
        return true;
    }
    $post = get_post( $post_id );
    if ( $post && preg_match( '/<img[^>]+src=["\']([^"\']+)["\']/i', $post->post_content, $match ) ) {
        printf( '<img class="%1$s" src="%2$s" alt="%3$s" loading="lazy" decoding="async">', esc_attr( $class ), esc_url( html_entity_decode( $match[1] ) ), esc_attr( get_the_title( $post_id ) ) );
        return true;
    }
    return false;
}
