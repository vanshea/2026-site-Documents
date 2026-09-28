<?php get_header(); ?>
<header class="archive-heading"><p class="eyebrow"><?php esc_html_e( 'Browse the blog', 'human-agency-design-2027' ); ?></p><?php the_archive_title( '<h1>', '</h1>' ); ?><?php the_archive_description( '<div class="archive-description">', '</div>' ); ?></header>
<?php if ( have_posts() ) : ?>
<section class="post-grid" aria-label="<?php esc_attr_e( 'Archive posts', 'human-agency-design-2027' ); ?>">
  <?php while ( have_posts() ) : the_post(); get_template_part( 'template-parts/content', 'card' ); endwhile; ?>
</section>
<?php the_posts_pagination( array( 'mid_size' => 1, 'prev_text' => __( 'Previous', 'human-agency-design-2027' ), 'next_text' => __( 'Next', 'human-agency-design-2027' ) ) ); ?>
<?php else : get_template_part( 'template-parts/content', 'none' ); endif; ?>
<?php get_footer(); ?>
