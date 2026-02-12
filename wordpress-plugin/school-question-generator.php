<?php
/**
 * Plugin Name: School Question Generator Subscription
 * Description: Manages School subscriptions, Teacher accounts, and validation for the Question Generator SaaS.
 * Version: 2.0.0
 * Author: Figma Make
 * Text Domain: sqg-subscription
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class SQG_Subscription_Manager {

    private static $instance = null;

    public static function get_instance() {
        if ( null === self::$instance ) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function __construct() {
        // Activation hook to setup roles
        register_activation_hook( __FILE__, array( $this, 'activate' ) );
        
        // Admin UI for Subscription Management
        add_action( 'show_user_profile', array( $this, 'show_school_fields' ) );
        add_action( 'edit_user_profile', array( $this, 'show_school_fields' ) );
        add_action( 'personal_options_update', array( $this, 'save_school_fields' ) );
        add_action( 'edit_user_profile_update', array( $this, 'save_school_fields' ) );

        // REST API
        add_action( 'rest_api_init', array( $this, 'register_routes' ) );

        // Admin Columns (Optional: to see subscription status easily in user list)
        add_filter( 'manage_users_columns', array( $this, 'add_users_column' ) );
        add_filter( 'manage_users_custom_column', array( $this, 'show_users_column_content' ), 10, 3 );
    }

    /**
     * Plugin Activation: Create Roles
     */
    public function activate() {
        // School Admin Role
        add_role( 'school_admin', 'School Admin', array(
            'read'         => true,
            'list_users'   => true, // Allow them to list their teachers
            'create_users' => true, // Allow them to create teachers
            'delete_users' => true, // Allow them to delete teachers
        ));

        // Teacher Role
        add_role( 'teacher', 'Teacher', array(
            'read' => true,
        ));
    }

    /**
     * Admin UI: Add Subscription Status field to User Profile
     */
    public function show_school_fields( $user ) {
        if ( ! in_array( 'school_admin', (array) $user->roles ) && ! current_user_can( 'administrator' ) ) {
            return;
        }

        // Only show for School Admins or when Admin is viewing a potential School Admin
        // But for simplicity, we show it if the target user is a School Admin
        if ( ! in_array( 'school_admin', (array) $user->roles ) ) {
             return; 
        }

        $status = get_user_meta( $user->ID, 'sqg_subscription_status', true );
        ?>
        <h3>School Subscription Settings</h3>
        <table class="form-table">
            <tr>
                <th><label for="sqg_subscription_status">Subscription Status</label></th>
                <td>
                    <select name="sqg_subscription_status" id="sqg_subscription_status">
                        <option value="inactive" <?php selected( $status, 'inactive' ); ?>>Inactive</option>
                        <option value="active" <?php selected( $status, 'active' ); ?>>Active</option>
                    </select>
                    <p class="description">Activate to allow this school and its teachers to use the generator.</p>
                </td>
            </tr>
        </table>
        <?php
    }

    public function save_school_fields( $user_id ) {
        if ( ! current_user_can( 'edit_user', $user_id ) ) {
            return false;
        }

        // Only save if the field was sent (admin context)
        if ( isset( $_POST['sqg_subscription_status'] ) ) {
            update_user_meta( $user_id, 'sqg_subscription_status', sanitize_text_field( $_POST['sqg_subscription_status'] ) );
        }
    }

    /**
     * Admin UI: Columns
     */
    public function add_users_column( $columns ) {
        $columns['sqg_status'] = 'Subscription';
        return $columns;
    }

    public function show_users_column_content( $value, $column_name, $user_id ) {
        if ( 'sqg_status' == $column_name ) {
            $user = get_userdata( $user_id );
            if ( in_array( 'school_admin', (array) $user->roles ) ) {
                $status = get_user_meta( $user_id, 'sqg_subscription_status', true );
                return ucfirst( $status ?: 'inactive' );
            }
            if ( in_array( 'teacher', (array) $user->roles ) ) {
                return 'Teacher';
            }
        }
        return $value;
    }

    /**
     * REST API Routes
     */
    public function register_routes() {
        $namespace = 'sqg/v1';

        // Check Subscription Status (For current user)
        register_rest_route( $namespace, '/status', array(
            'methods'             => 'GET',
            'callback'            => array( $this, 'get_status' ),
            'permission_callback' => function() { return is_user_logged_in(); },
        ));

        // List Teachers (For School Admin)
        register_rest_route( $namespace, '/teachers', array(
            'methods'             => 'GET',
            'callback'            => array( $this, 'get_teachers' ),
            'permission_callback' => array( $this, 'check_school_admin' ),
        ));

        // Add Teacher (For School Admin)
        register_rest_route( $namespace, '/teachers', array(
            'methods'             => 'POST',
            'callback'            => array( $this, 'add_teacher' ),
            'permission_callback' => array( $this, 'check_school_admin' ),
        ));

        // Delete Teacher (For School Admin)
        register_rest_route( $namespace, '/teachers/(?P<id>\d+)', array(
            'methods'             => 'DELETE',
            'callback'            => array( $this, 'delete_teacher' ),
            'permission_callback' => array( $this, 'check_school_admin' ),
        ));
    }

    /**
     * Permissions Check
     */
    public function check_school_admin() {
        $user = wp_get_current_user();
        return in_array( 'school_admin', (array) $user->roles ) || current_user_can( 'administrator' );
    }

    /**
     * API: Get Status
     */
    public function get_status( $request ) {
        $user = wp_get_current_user();
        $response = [
            'id' => $user->ID,
            'username' => $user->user_login,
            'roles' => $user->roles,
            'is_active' => false,
            'school_name' => '',
            'message' => 'Inactive or Invalid Role'
        ];

        if ( in_array( 'administrator', (array) $user->roles ) ) {
             $response['is_active'] = true;
             $response['message'] = 'Super Admin';
             return rest_ensure_response( $response );
        }

        if ( in_array( 'school_admin', (array) $user->roles ) ) {
            $status = get_user_meta( $user->ID, 'sqg_subscription_status', true );
            $response['is_active'] = ( $status === 'active' );
            $response['school_name'] = $user->display_name;
            $response['message'] = $response['is_active'] ? 'Active School Subscription' : 'Subscription Inactive';
        } 
        elseif ( in_array( 'teacher', (array) $user->roles ) ) {
            $parent_id = get_user_meta( $user->ID, 'sqg_parent_school_id', true );
            if ( $parent_id ) {
                $parent_status = get_user_meta( $parent_id, 'sqg_subscription_status', true );
                $parent_user = get_userdata( $parent_id );
                $response['is_active'] = ( $parent_status === 'active' );
                $response['school_name'] = $parent_user ? $parent_user->display_name : 'Unknown School';
                $response['message'] = $response['is_active'] ? 'Active Teacher Account' : 'School Subscription Inactive';
            } else {
                $response['message'] = 'Teacher not linked to a school';
            }
        }

        return rest_ensure_response( $response );
    }

    /**
     * API: Get Teachers
     */
    public function get_teachers( $request ) {
        $user_id = get_current_user_id();
        
        $teachers = get_users( array(
            'role' => 'teacher',
            'meta_key' => 'sqg_parent_school_id',
            'meta_value' => $user_id
        ));

        $data = array();
        foreach ( $teachers as $teacher ) {
            $data[] = array(
                'id' => $teacher->ID,
                'name' => $teacher->display_name,
                'email' => $teacher->user_email,
                'username' => $teacher->user_login,
                'created_at' => $teacher->user_registered
            );
        }

        return rest_ensure_response( $data );
    }

    /**
     * API: Add Teacher
     */
    public function add_teacher( $request ) {
        $user_id = get_current_user_id();

        // Check Limit (20)
        $current_teachers = get_users( array(
            'role' => 'teacher',
            'meta_key' => 'sqg_parent_school_id',
            'meta_value' => $user_id,
            'fields' => 'ids'
        ));

        if ( count( $current_teachers ) >= 20 ) {
            return new WP_Error( 'limit_reached', 'Teacher limit (20) reached for this subscription.', array( 'status' => 403 ) );
        }

        $params = $request->get_json_params();

        if ( ! isset( $params['email'] ) || ! isset( $params['username'] ) || ! isset( $params['password'] ) ) {
            return new WP_Error( 'missing_fields', 'Email, username, and password are required.', array( 'status' => 400 ) );
        }

        $email = sanitize_email( $params['email'] );
        $username = sanitize_user( $params['username'] );
        $password = $params['password'];
        $name = isset( $params['name'] ) ? sanitize_text_field( $params['name'] ) : $username;

        if ( email_exists( $email ) || username_exists( $username ) ) {
            return new WP_Error( 'user_exists', 'User with this email or username already exists.', array( 'status' => 400 ) );
        }

        $new_user_id = wp_create_user( $username, $password, $email );

        if ( is_wp_error( $new_user_id ) ) {
            return $new_user_id;
        }

        // Set Role and Parent
        $user_obj = new WP_User( $new_user_id );
        $user_obj->set_role( 'teacher' );
        
        wp_update_user( array( 'ID' => $new_user_id, 'display_name' => $name ) );
        update_user_meta( $new_user_id, 'sqg_parent_school_id', $user_id );

        return rest_ensure_response( array( 'success' => true, 'id' => $new_user_id, 'message' => 'Teacher added successfully.' ) );
    }

    /**
     * API: Delete Teacher
     */
    public function delete_teacher( $request ) {
        $current_user_id = get_current_user_id();
        $teacher_id = $request['id'];

        // Verify ownership
        $parent_id = get_user_meta( $teacher_id, 'sqg_parent_school_id', true );
        
        if ( (int)$parent_id !== $current_user_id && ! current_user_can( 'administrator' ) ) {
            return new WP_Error( 'forbidden', 'You do not have permission to delete this user.', array( 'status' => 403 ) );
        }

        // Delete user
        require_once( ABSPATH . 'wp-admin/includes/user.php' );
        $deleted = wp_delete_user( $teacher_id );

        if ( ! $deleted ) {
            return new WP_Error( 'delete_failed', 'Could not delete user.', array( 'status' => 500 ) );
        }

        return rest_ensure_response( array( 'success' => true, 'id' => $teacher_id, 'message' => 'Teacher deleted.' ) );
    }
}

// Initialize
SQG_Subscription_Manager::get_instance();
