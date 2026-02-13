<?php
/**
 * REST API Endpoints for Question Paper PDF Generation
 */

if (!defined('ABSPATH')) {
    exit;
}

class QP_REST_API {
    
    private static $instance = null;
    
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    private function __construct() {
        add_action('rest_api_init', array($this, 'register_routes'));
    }
    
    /**
     * Register REST API routes
     */
    public function register_routes() {
        $namespace = 'qpm/v1';
        
        // PAPERS LIST - GET all papers and POST to create
        register_rest_route($namespace, '/papers', array(
            array(
                'methods'             => 'GET',
                'callback'            => array($this, 'get_papers'),
                'permission_callback' => '__return_true',
            ),
            array(
                'methods'             => 'POST',
                'callback'            => array($this, 'save_paper'),
                'permission_callback' => '__return_true',
            ),
        ));
        
        // SINGLE PAPER - GET, PUT, DELETE
        register_rest_route($namespace, '/papers/(?P<id>\d+)', array(
            array(
                'methods'             => 'GET',
                'callback'            => array($this, 'get_paper'),
                'permission_callback' => '__return_true',
                'args'                => array(
                    'id' => array(
                        'required'          => true,
                        'validate_callback' => function($param) {
                            return is_numeric($param);
                        }
                    ),
                ),
            ),
            array(
                'methods'             => 'PUT',
                'callback'            => array($this, 'update_paper'),
                'permission_callback' => '__return_true',
                'args'                => array(
                    'id' => array(
                        'required'          => true,
                        'validate_callback' => function($param) {
                            return is_numeric($param);
                        }
                    ),
                ),
            ),
            array(
                'methods'             => 'DELETE',
                'callback'            => array($this, 'delete_paper'),
                'permission_callback' => '__return_true',
                'args'                => array(
                    'id' => array(
                        'required'          => true,
                        'validate_callback' => function($param) {
                            return is_numeric($param);
                        }
                    ),
                ),
            ),
        ));
        
        // DUPLICATE PAPER
        register_rest_route($namespace, '/papers/(?P<id>\d+)/duplicate', array(
            'methods'             => 'POST',
            'callback'            => array($this, 'duplicate_paper'),
            'permission_callback' => '__return_true',
            'args'                => array(
                'id' => array(
                    'required'          => true,
                    'validate_callback' => function($param) {
                        return is_numeric($param);
                    }
                ),
            ),
        ));
        
        // GENERATE PDF
        register_rest_route($namespace, '/generate-pdf', array(
            'methods'             => 'POST',
            'callback'            => array($this, 'generate_pdf'),
            'permission_callback' => '__return_true',
        ));
        
        // GET PDF by ID
        register_rest_route($namespace, '/papers/(?P<id>\d+)/pdf', array(
            'methods'             => 'GET',
            'callback'            => array($this, 'get_pdf'),
            'permission_callback' => '__return_true',
            'args'                => array(
                'id' => array(
                    'required'          => true,
                    'validate_callback' => function($param) {
                        return is_numeric($param);
                    }
                ),
            ),
        ));
    }
    
    /**
     * Check email for authentication
     */
    public function check_email($request) {
        $email = $request->get_param('email');
        
        if (empty($email) || !is_email($email)) {
            return new WP_Error(
                'invalid_email',
                'Invalid email address',
                array('status' => 400)
            );
        }
        
        // Check if user exists with this email
        $user = get_user_by('email', $email);
        
        if (!$user) {
            return new WP_Error(
                'user_not_found',
                'User not found with this email',
                array('status' => 404)
            );
        }
        
        // Generate unique auth token for this device
        $auth_token = wp_hash($user->ID . time() . wp_rand(), 'auth');
        
        // Store token in user meta (this will overwrite previous token - ensuring single device login)
        update_user_meta($user->ID, 'myqugen_auth_token', $auth_token);
        update_user_meta($user->ID, 'myqugen_login_time', current_time('mysql'));
        
        return new WP_REST_Response(array(
            'success' => true,
            'user_id' => $user->ID,
            'user_display_name' => $user->display_name,
            'auth_token' => $auth_token,
            'message' => 'Email verified successfully'
        ), 200);
    }
    
    /**
     * Verify token
     */
    public function verify_token($request) {
        $params = $request->get_json_params();
        $token = isset($params['token']) ? $params['token'] : '';
        $email = isset($params['email']) ? sanitize_email($params['email']) : '';
        
        if (empty($token) || empty($email)) {
            return new WP_Error(
                'missing_params',
                'Token and email are required',
                array('status' => 400)
            );
        }
        
        // Get user by email
        $user = get_user_by('email', $email);
        
        if (!$user) {
            return new WP_Error(
                'user_not_found',
                'User not found',
                array('status' => 404)
            );
        }
        
        // Get stored token
        $stored_token = get_user_meta($user->ID, 'myqugen_auth_token', true);
        
        // Verify token matches
        if ($stored_token !== $token) {
            return new WP_Error(
                'invalid_token',
                'Invalid or expired token. You may have logged in from another device.',
                array('status' => 401)
            );
        }
        
        return new WP_REST_Response(array(
            'success' => true,
            'user_id' => $user->ID,
            'user_display_name' => $user->display_name,
            'message' => 'Token verified successfully'
        ), 200);
    }
    
    /**
     * Generate PDF from question paper data
     */
    public function generate_pdf($request) {
        try {
            $params = $request->get_json_params();
            
            if (empty($params['questionPaper']) || empty($params['pageSettings'])) {
                return new WP_Error(
                    'missing_data',
                    'Question paper data and page settings are required',
                    array('status' => 400)
                );
            }
            
            // Initialize PDF generator
            $generator = new QP_PDF_Generator();
            
            // Generate PDF
            $result = $generator->generate(
                $params['questionPaper'],
                $params['pageSettings'],
                isset($params['title']) ? $params['title'] : 'question-paper'
            );
            
            if (is_wp_error($result)) {
                return $result;
            }
            
            return new WP_REST_Response(array(
                'success'  => true,
                'pdf_url'  => $result['url'],
                'file_path' => $result['path'],
                'message'  => 'PDF generated successfully'
            ), 200);
            
        } catch (Exception $e) {
            return new WP_Error(
                'pdf_generation_failed',
                $e->getMessage(),
                array('status' => 500)
            );
        }
    }
    
    /**
     * Get PDF URL for a saved paper
     */
    public function get_pdf($request) {
        $post_id = $request->get_param('id');
        
        // Check if post exists
        $post = get_post($post_id);
        if (!$post || $post->post_type !== 'question_paper') {
            return new WP_Error(
                'not_found',
                'Question paper not found',
                array('status' => 404)
            );
        }
        
        // Get PDF URL from meta
        $pdf_url = get_post_meta($post_id, 'qp_pdf_url', true);
        
        if (empty($pdf_url)) {
            return new WP_Error(
                'pdf_not_generated',
                'PDF not generated for this paper',
                array('status' => 404)
            );
        }
        
        return new WP_REST_Response(array(
            'success' => true,
            'pdf_url' => $pdf_url,
            'generated_at' => get_post_meta($post_id, 'qp_pdf_generated_at', true)
        ), 200);
    }
    
    /**
     * Save question paper
     */
    public function save_paper($request) {
        try {
            $params = $request->get_json_params();
            
            if (empty($params['title'])) {
                return new WP_Error(
                    'missing_title',
                    'Title is required',
                    array('status' => 400)
                );
            }
            
            // Create post
            $post_data = array(
                'post_title'   => sanitize_text_field($params['title']),
                'post_type'    => 'question_paper',
                'post_status'  => 'publish',
                'post_content' => '',
            );
            
            $post_id = wp_insert_post($post_data);
            
            if (is_wp_error($post_id)) {
                return $post_id;
            }
            
            // Save question paper data (React sends 'data')
            if (!empty($params['data'])) {
                update_post_meta($post_id, 'qp_data', wp_json_encode($params['data']));
            }
            
            // Save page settings
            if (!empty($params['pageSettings'])) {
                update_post_meta($post_id, 'qp_page_settings', wp_json_encode($params['pageSettings']));
            }
            
            return new WP_REST_Response(array(
                'success' => true,
                'post_id' => $post_id,
                'message' => 'Question paper saved successfully'
            ), 201);
            
        } catch (Exception $e) {
            return new WP_Error(
                'save_failed',
                $e->getMessage(),
                array('status' => 500)
            );
        }
    }
    
    /**
     * Get all question papers
     */
    public function get_papers($request) {
        // Get user ID from auth token if available
        $user_id = $this->get_user_from_request($request);
        
        $args = array(
            'post_type'      => 'question_paper',
            'posts_per_page' => -1,
            'post_status'    => 'publish',
            'orderby'        => 'date',
            'order'          => 'DESC'
        );
        
        // Filter by user if authenticated
        if ($user_id) {
            $args['author'] = $user_id;
        }
        
        $query = new WP_Query($args);
        $papers = array();
        
        if ($query->have_posts()) {
            while ($query->have_posts()) {
                $query->the_post();
                $post_id = get_the_ID();
                
                // Get full paper data
                $paper_data = get_post_meta($post_id, 'qp_data', true);
                $page_settings = get_post_meta($post_id, 'qp_page_settings', true);
                
                $papers[] = array(
                    'id'            => (string)$post_id,
                    'title'         => get_the_title(),
                    'createdAt'     => get_the_date('c'),
                    'updatedAt'     => get_the_modified_date('c'),
                    'pdf_url'       => get_post_meta($post_id, 'qp_pdf_url', true),
                    'data'          => $paper_data ? json_decode($paper_data, true) : null,
                    'pageSettings'  => $page_settings ? json_decode($page_settings, true) : null,
                    'has_pdf'       => !empty(get_post_meta($post_id, 'qp_pdf_url', true)),
                );
            }
            wp_reset_postdata();
        }
        
        return new WP_REST_Response(array(
            'success' => true,
            'papers'  => $papers,
            'total'   => count($papers)
        ), 200);
    }

    /**
     * Get a single paper by ID
     */
    public function get_paper($request) {
        $post_id = $request->get_param('id');
        
        // Check if post exists
        $post = get_post($post_id);
        if (!$post || $post->post_type !== 'question_paper') {
            return new WP_Error(
                'not_found',
                'Question paper not found',
                array('status' => 404)
            );
        }
        
        // Get full paper data
        $paper_data = get_post_meta($post_id, 'qp_data', true);
        $page_settings = get_post_meta($post_id, 'qp_page_settings', true);
        
        return new WP_REST_Response(array(
            'success' => true,
            'paper' => array(
                'id'            => (string)$post_id,
                'title'         => get_the_title($post_id),
                'createdAt'     => get_the_date('c', $post_id),
                'updatedAt'     => get_the_modified_date('c', $post_id),
                'pdf_url'       => get_post_meta($post_id, 'qp_pdf_url', true),
                'data'          => $paper_data ? json_decode($paper_data, true) : null,
                'pageSettings'  => $page_settings ? json_decode($page_settings, true) : null,
            )
        ), 200);
    }

    /**
     * Update a question paper
     */
    public function update_paper($request) {
        try {
            $post_id = $request->get_param('id');
            $params = $request->get_json_params();
            
            // Check if post exists
            $post = get_post($post_id);
            if (!$post || $post->post_type !== 'question_paper') {
                return new WP_Error(
                    'not_found',
                    'Question paper not found',
                    array('status' => 404)
                );
            }
            
            // Update post title if provided
            if (!empty($params['title'])) {
                wp_update_post(array(
                    'ID' => $post_id,
                    'post_title' => sanitize_text_field($params['title'])
                ));
            }
            
            // Update paper data
            if (!empty($params['data'])) {
                update_post_meta($post_id, 'qp_data', wp_json_encode($params['data']));
            }
            
            // Update page settings
            if (!empty($params['pageSettings'])) {
                update_post_meta($post_id, 'qp_page_settings', wp_json_encode($params['pageSettings']));
            }
            
            return new WP_REST_Response(array(
                'success' => true,
                'post_id' => $post_id,
                'message' => 'Question paper updated successfully'
            ), 200);
            
        } catch (Exception $e) {
            return new WP_Error(
                'update_failed',
                $e->getMessage(),
                array('status' => 500)
            );
        }
    }

    /**
     * Delete a question paper
     */
    public function delete_paper($request) {
        try {
            $post_id = $request->get_param('id');
            
            // Check if post exists
            $post = get_post($post_id);
            if (!$post || $post->post_type !== 'question_paper') {
                return new WP_Error(
                    'not_found',
                    'Question paper not found',
                    array('status' => 404)
                );
            }
            
            // Delete post and its meta
            wp_delete_post($post_id, true);
            
            return new WP_REST_Response(array(
                'success' => true,
                'message' => 'Question paper deleted successfully'
            ), 200);
            
        } catch (Exception $e) {
            return new WP_Error(
                'delete_failed',
                $e->getMessage(),
                array('status' => 500)
            );
        }
    }

    /**
     * Duplicate a question paper
     */
    public function duplicate_paper($request) {
        try {
            $post_id = $request->get_param('id');
            
            // Check if post exists
            $post = get_post($post_id);
            if (!$post || $post->post_type !== 'question_paper') {
                return new WP_Error(
                    'not_found',
                    'Question paper not found',
                    array('status' => 404)
                );
            }
            
            // Get original paper data
            $original_title = get_the_title($post_id);
            $paper_data = get_post_meta($post_id, 'qp_data', true);
            $page_settings = get_post_meta($post_id, 'qp_page_settings', true);
            
            // Create new post
            $new_post_data = array(
                'post_title'   => $original_title . ' (Copy)',
                'post_type'    => 'question_paper',
                'post_status'  => 'publish',
                'post_author'  => get_post_field('post_author', $post_id),
            );
            
            $new_post_id = wp_insert_post($new_post_data);
            
            if (is_wp_error($new_post_id)) {
                return $new_post_id;
            }
            
            // Copy meta data
            if ($paper_data) {
                update_post_meta($new_post_id, 'qp_data', $paper_data);
            }
            if ($page_settings) {
                update_post_meta($new_post_id, 'qp_page_settings', $page_settings);
            }
            
            return new WP_REST_Response(array(
                'success' => true,
                'post_id' => $new_post_id,
                'message' => 'Question paper duplicated successfully'
            ), 201);
            
        } catch (Exception $e) {
            return new WP_Error(
                'duplicate_failed',
                $e->getMessage(),
                array('status' => 500)
            );
        }
    }

    /**
     * Helper: Get user ID from auth token in request
     */
    private function get_user_from_request($request) {
        $headers = $request->get_headers();
        
        // Check for Authorization header with token
        if (isset($headers['authorization'])) {
            $auth_header = $headers['authorization'];
            if (strpos($auth_header, 'Bearer ') === 0) {
                $token = substr($auth_header, 7);
                
                // Find user by token
                $users = get_users(array(
                    'meta_key' => 'myqugen_auth_token',
                    'meta_value' => $token
                ));
                
                return !empty($users) ? $users[0]->ID : null;
            }
        }
        
        return null;
    }
}