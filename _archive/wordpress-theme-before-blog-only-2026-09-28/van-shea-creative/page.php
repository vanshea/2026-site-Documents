<?php get_header(); ?>
<main id="main" class="container section wp-page-content">
  <?php while ( have_posts() ) : the_post(); ?>
    <article <?php post_class(); ?>><h1><?php the_title(); ?></h1><div class="entry-content"><?php the_content(); ?></div></article>
  <?php endwhile; ?>
</main>
<?php get_footer(); ?>
