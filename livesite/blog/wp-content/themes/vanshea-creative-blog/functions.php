<?php
/**
 * Theme setup for Van Shea Creative Blog.
 *
 * @package VanSheaCreativeBlog
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function vanshea_creative_blog_setup() {
	load_theme_textdomain( 'vanshea-creative-blog', get_template_directory() . '/languages' );

	add_theme_support( 'automatic-feed-links' );
	add_theme_support( 'title-tag' );
	add_theme_support( 'post-thumbnails' );
	add_theme_support( 'responsive-embeds' );
	add_theme_support( 'align-wide' );
	add_theme_support( 'html5', array( 'search-form', 'comment-form', 'comment-list', 'gallery', 'caption', 'style', 'script' ) );

	register_nav_menus(
		array(
			'primary' => __( 'Primary Menu', 'vanshea-creative-blog' ),
		)
	);
}
add_action( 'after_setup_theme', 'vanshea_creative_blog_setup' );

function vanshea_creative_blog_assets() {
	wp_enqueue_style(
		'vanshea-creative-fonts',
		'https://fonts.googleapis.com/css2?family=Lexend+Deca:wght@400;500;700;800&family=Open+Sans:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;700&display=swap',
		array(),
		null
	);

	wp_enqueue_style(
		'vanshea-creative-blog-style',
		get_stylesheet_uri(),
		array( 'vanshea-creative-fonts' ),
		wp_get_theme()->get( 'Version' )
	);

	wp_enqueue_script(
		'vanshea-creative-blog-script',
		get_template_directory_uri() . '/assets/theme.js',
		array(),
		wp_get_theme()->get( 'Version' ),
		true
	);
}
add_action( 'wp_enqueue_scripts', 'vanshea_creative_blog_assets' );

function vanshea_creative_blog_excerpt_length() {
	return 24;
}
add_filter( 'excerpt_length', 'vanshea_creative_blog_excerpt_length' );

function vanshea_creative_blog_excerpt_more() {
	return '...';
}
add_filter( 'excerpt_more', 'vanshea_creative_blog_excerpt_more' );

function vanshea_creative_blog_posted_on() {
	printf(
		'<span class="posted-on">%1$s</span>',
		esc_html( get_the_date() )
	);
}

function vanshea_creative_blog_posted_by() {
	printf(
		'<span class="byline">%1$s</span>',
		esc_html( get_the_author() )
	);
}

function vanshea_creative_blog_get_first_content_image_url( $post_id = null ) {
	$post_id = $post_id ? $post_id : get_the_ID();
	$post    = get_post( $post_id );

	if ( ! $post || empty( $post->post_content ) ) {
		return '';
	}

	if ( preg_match( '/<img[^>]+src=["\']([^"\']+)["\']/i', $post->post_content, $matches ) ) {
		return esc_url_raw( html_entity_decode( $matches[1] ) );
	}

	return '';
}

function vanshea_creative_blog_get_attached_image_id( $post_id = null ) {
	$post_id = $post_id ? $post_id : get_the_ID();

	$attachments = get_children(
		array(
			'post_parent'    => $post_id,
			'post_type'      => 'attachment',
			'post_mime_type' => 'image',
			'numberposts'    => 1,
			'orderby'        => 'menu_order date',
			'order'          => 'ASC',
			'fields'         => 'ids',
		)
	);

	if ( empty( $attachments ) ) {
		return 0;
	}

	return (int) reset( $attachments );
}

function vanshea_creative_blog_post_image( $size = 'large', $class = '' ) {
	$post_id = get_the_ID();

	if ( has_post_thumbnail( $post_id ) ) {
		the_post_thumbnail(
			$size,
			array(
				'class' => $class,
			)
		);
		return true;
	}

	$attachment_id = vanshea_creative_blog_get_attached_image_id( $post_id );
	if ( $attachment_id ) {
		echo wp_get_attachment_image(
			$attachment_id,
			$size,
			false,
			array(
				'class' => $class,
			)
		);
		return true;
	}

	$content_image_url = vanshea_creative_blog_get_first_content_image_url( $post_id );
	if ( $content_image_url ) {
		printf(
			'<img class="%1$s" src="%2$s" alt="%3$s" loading="lazy">',
			esc_attr( $class ),
			esc_url( $content_image_url ),
			esc_attr( get_the_title( $post_id ) )
		);
		return true;
	}

	return false;
}

function vanshea_creative_blog_maybe_set_missing_featured_images() {
	if ( ! current_user_can( 'manage_options' ) || empty( $_GET['vsc_set_featured_images'] ) ) {
		return;
	}

	check_admin_referer( 'vsc_set_featured_images' );

	$updated = 0;
	$query   = new WP_Query(
		array(
			'post_type'      => array( 'post', 'page' ),
			'post_status'    => 'any',
			'posts_per_page' => -1,
			'fields'         => 'ids',
			'meta_query'     => array(
				array(
					'key'     => '_thumbnail_id',
					'compare' => 'NOT EXISTS',
				),
			),
		)
	);

	foreach ( $query->posts as $post_id ) {
		$attachment_id = vanshea_creative_blog_get_attached_image_id( $post_id );
		if ( ! $attachment_id ) {
			continue;
		}

		if ( set_post_thumbnail( $post_id, $attachment_id ) ) {
			$updated++;
		}
	}

	wp_safe_redirect(
		add_query_arg(
			array(
				'vsc_featured_images_updated' => $updated,
			),
			admin_url( 'themes.php' )
		)
	);
	exit;
}
add_action( 'admin_init', 'vanshea_creative_blog_maybe_set_missing_featured_images' );

function vanshea_creative_blog_featured_image_admin_notice() {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}

	if ( isset( $_GET['vsc_featured_images_updated'] ) ) {
		printf(
			'<div class="notice notice-success is-dismissible"><p>%s</p></div>',
			esc_html(
				sprintf(
					/* translators: %s: number of updated posts. */
					__( 'Van Shea Creative Blog set featured images on %s posts/pages.', 'vanshea-creative-blog' ),
					number_format_i18n( (int) $_GET['vsc_featured_images_updated'] )
				)
			)
		);
		return;
	}

	$url = wp_nonce_url(
		add_query_arg( 'vsc_set_featured_images', '1', admin_url( 'themes.php' ) ),
		'vsc_set_featured_images'
	);

	printf(
		'<div class="notice notice-info"><p>%1$s <a class="button button-primary" href="%2$s">%3$s</a></p></div>',
		esc_html__( 'Imported posts may have attached images without featured images.', 'vanshea-creative-blog' ),
		esc_url( $url ),
		esc_html__( 'Set featured images from attachments', 'vanshea-creative-blog' )
	);
}
add_action( 'admin_notices', 'vanshea_creative_blog_featured_image_admin_notice' );
