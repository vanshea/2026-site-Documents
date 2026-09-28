<?php get_header(); ?>
<?php if ( ! is_paged() ) : ?>
<section class="blog-hero">
  <p class="eyebrow"><?php esc_html_e( 'Blog', 'human-agency-design-2027' ); ?></p>
  <h1><?php bloginfo( 'name' ); ?></h1>
  <?php if ( get_bloginfo( 'description' ) ) : ?><p class="lead"><?php echo esc_html( get_bloginfo( 'description' ) ); ?></p><?php endif; ?>
</section>
<?php endif; ?>
<?php if ( have_posts() ) : ?>
<section class="post-grid" aria-label="<?php esc_attr_e( 'Blog posts', 'human-agency-design-2027' ); ?>">
  <?php while ( have_posts() ) : the_post(); get_template_part( 'template-parts/content', 'card' ); endwhile; ?>
</section>
<?php the_posts_pagination( array( 'mid_size' => 1, 'prev_text' => __( 'Previous', 'human-agency-design-2027' ), 'next_text' => __( 'Next', 'human-agency-design-2027' ) ) ); ?>
<?php else : get_template_part( 'template-parts/content', 'none' ); endif; ?>
<?php get_footer(); ?>
