<?php
/**
 * Plugin Name: MyQugen Auth
 * Description: Simple email authentication for Question Paper Generator
 * Version: 1.0.0
 * Author: Your Name
 */

// Prevent direct file access
if (!defined('ABSPATH')) {
    exit;
}

// Register REST API route
add_action('rest_api_init', function () {
    register_rest_route('myqugen/v1', '/auth', array(
        'methods'  => 'POST',
        'callback' => 'myqugen_check_email',
        'permission_callback' => '__return_true',
    ));
});

/**
 * Check if email exists in WordPress users
 */
function myqugen_check_email($request) {
    $params = $request->get_json_params();
    $email = isset($params['email']) ? sanitize_email($params['email']) : '';

    if (empty($email) || !is_email($email)) {
        return new WP_Error('invalid_email', 'Invalid email address', array('status' => 400));
    }

    $user = get_user_by('email', $email);

    if ($user) {
        return new WP_REST_Response(array(
            'success' => true,
            'user_id' => $user->ID,
            'user_display_name' => $user->display_name,
            'message' => 'Email verified successfully'
        ), 200);
    } else {
        return new WP_Error('user_not_found', 'User not found with this email', array('status' => 404));
    }
}
