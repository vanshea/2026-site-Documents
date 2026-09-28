<?php get_header(); ?>
<main id="main" class="container section wp-page-content">
  <?php if ( have_posts() ) : while ( have_posts() ) : the_post(); ?>
    <article <?php post_class(); ?>><h1><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h1><div class="entry-content"><?php the_excerpt(); ?></div></article>
  <?php endwhile; the_posts_pagination(); else : ?><h1><?php esc_html_e( 'Nothing found', 'van-shea-creative' ); ?></h1><?php endif; ?>
</main>
<?php get_footer(); ?>
