<?php get_header(); ?>
<?php while ( have_posts() ) : the_post(); get_template_part( 'template-parts/content', 'single' ); the_post_navigation( array( 'prev_text' => __( 'Previous: %title', 'human-agency-design-2027' ), 'next_text' => __( 'Next: %title', 'human-agency-design-2027' ) ) ); if ( comments_open() || get_comments_number() ) { comments_template(); } endwhile; ?>
<?php get_footer(); ?>
