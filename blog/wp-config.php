<?php
/**
 * SiteGround-ready WordPress configuration for the /blog install.
 *
 * Before uploading, replace DB_NAME, DB_USER, DB_PASSWORD, and DB_HOST with
 * the values from SiteGround Site Tools > Site > MySQL.
 */

define( 'DB_NAME', 'siteground_database_name_here' );
define( 'DB_USER', 'siteground_database_user_here' );
define( 'DB_PASSWORD', 'siteground_database_password_here' );
define( 'DB_HOST', 'localhost' );

define( 'DB_CHARSET', 'utf8mb4' );
define( 'DB_COLLATE', '' );

define( 'AUTH_KEY',         'VF9WRGChn6+rn/Y0KpVxjhPaYSnDCtAu8+L1xVTtspQePSYHj69X+Q99OI6vQqrF' );
define( 'SECURE_AUTH_KEY',  '3n7kgPpjqKd04CYro4ciraRw6BfLvuVN6dCXf7roPAjBiEnpIbik65T8oiu9LpM6' );
define( 'LOGGED_IN_KEY',    'hv8IF2bBcKfcb4l8MSSzX9C3cEj5/798OEyYhwexaaNQ8AxhJRc6mJ8sgF5IyMTM' );
define( 'NONCE_KEY',        '2+z5jCKcaGTNY1FfmkWCdMVxSpqAyhpmWkIMu7R1nuk2uZUDGsFJy/+FYezQ+hyQ' );
define( 'AUTH_SALT',        '7mwHYqiE+bvNYsJHrC22FC66o1lHI8m880K/fifYqjf41/0Dk/HWqMXG1SmlCgzR' );
define( 'SECURE_AUTH_SALT', 'nu1pextclY+fPRcpi/YbyP1tixj7HjI78dz4m6eyeqeMTKtI5YRa8adEFV39j7OU' );
define( 'LOGGED_IN_SALT',   'SFcih4HyYg2VL88xXln0cl+kk+JFqZTIz+yfOIfggXZtFLS6BcH6r1kB56+I1PgH' );
define( 'NONCE_SALT',       'V6nD/iWYD4DOpzyCDC2bJ7sKBqeLajKCXobER8lWrI37S3tYy0qMs8ynxnLlkRmz' );

$table_prefix = 'wp_icjz_';

define( 'WP_DEBUG', false );

/* Add any custom values between this line and the "stop editing" line. */

define( 'WP_HOME', 'http://www.vanshea.com/blog' );
define( 'WP_SITEURL', 'http://www.vanshea.com/blog' );

/* That's all, stop editing! Happy publishing. */

if ( ! defined( 'ABSPATH' ) ) {
	define( 'ABSPATH', __DIR__ . '/' );
}

require_once ABSPATH . 'wp-settings.php';
