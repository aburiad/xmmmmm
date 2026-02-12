import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';

// Roles based on WP requirements
export type UserRole = 'super_admin' | 'school_admin' | 'teacher' | 'teacher_user'; // teacher_user alias for legacy

export interface Teacher {
  id: string;
  name: string;
  email: string;
  username: string;
  parent_school_id: string;
  joinedAt: string;
}

export interface SubscriptionStatus {
  status: 'active' | 'inactive';
  expire_date: string; // YYYY-MM-DD
  teacher_limit: number;
  used_teacher_count: number;
}

export interface UserProfile {
  id: string;
  role: UserRole;
  name: string;
  email: string;
  school_id?: string;
}

interface NewTeacherData {
  name: string;
  email: string;
  username: string;
  password?: string;
}

interface SubscriptionContextType {
  user: UserProfile | null;
  subscription: SubscriptionStatus;
  teachers: Teacher[];
  login: (role: UserRole) => void;
  updateSubscription: (data: Partial<SubscriptionStatus>) => void;
  addTeacher: (data: NewTeacherData) => Promise<boolean>;
  removeTeacher: (id: string) => void;
  isSubscriptionValid: () => boolean;
  canPerformAction: () => boolean;
  isLoading: boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

const STORAGE_KEYS = {
  SUB: 'wp_subscription_meta',
  TEACHERS: 'wp_teachers_data',
  USER: 'wp_current_user'
};

const defaultSubscription: SubscriptionStatus = {
  status: 'inactive',
  expire_date: '2025-12-31',
  teacher_limit: 20,
  used_teacher_count: 0,
};

// API Configuration
const API_BASE = '/wp-json/sqg/v1';

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  
  // State
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.USER);
    return saved ? JSON.parse(saved) : { id: 'admin_1', role: 'super_admin', name: 'Super Admin', email: 'admin@example.com' };
  });

  const [subscription, setSubscription] = useState<SubscriptionStatus>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SUB);
    return saved ? JSON.parse(saved) : defaultSubscription;
  });

  const [teachers, setTeachers] = useState<Teacher[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TEACHERS);
    return saved ? JSON.parse(saved) : [];
  });

  // Sync to API
  const fetchFromAPI = async () => {
    try {
      setIsLoading(true);
      
      // 1. Get Status
      const statusRes = await fetch(`${API_BASE}/status`);
      if (statusRes.ok) {
        const statusData = await statusRes.json();
        // Update user and subscription based on API
        // This logic depends on exact API response structure
        // For now, we keep the mock/localStorage as primary if API fails
      }

      // 2. Get Teachers (if school admin)
      if (user?.role === 'school_admin') {
        const teachersRes = await fetch(`${API_BASE}/teachers`);
        if (teachersRes.ok) {
          const teachersData = await teachersRes.json();
          // Map API response to our Teacher interface
          const mappedTeachers = teachersData.map((t: any) => ({
             id: t.id,
             name: t.name,
             email: t.email,
             username: t.username,
             parent_school_id: user.id,
             joinedAt: t.created_at
          }));
          setTeachers(mappedTeachers);
          setSubscription(prev => ({ ...prev, used_teacher_count: mappedTeachers.length }));
        }
      }

    } catch (error) {
      console.log("API not available, using local mock data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFromAPI();
  }, [user?.role]);

  // Persist changes (Mock Fallback)
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SUB, JSON.stringify(subscription));
    localStorage.setItem(STORAGE_KEYS.TEACHERS, JSON.stringify(teachers));
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  }, [subscription, teachers, user]);

  const login = (role: UserRole) => {
    const mockUser: UserProfile = {
      id: Math.random().toString(36).substr(2, 9),
      role,
      name: role === 'super_admin' ? 'Super Admin' : role === 'school_admin' ? 'School Admin' : 'Teacher User',
      email: `${role}@school.com`,
      school_id: role === 'teacher' || role === 'teacher_user' ? 'school_123' : undefined
    };
    setUser(mockUser);
    toast.success(`${role} হিসেবে লগইন করা হয়েছে (Developer Mode)`);
  };

  const isSubscriptionValid = () => {
    if (subscription.status !== 'active') return false;
    const today = new Date().toISOString().split('T')[0];
    return subscription.expire_date >= today;
  };

  const canPerformAction = () => {
    if (user?.role === 'super_admin') return true;
    return isSubscriptionValid();
  };

  const updateSubscription = (data: Partial<SubscriptionStatus>) => {
    setSubscription(prev => ({ ...prev, ...data }));
    toast.success('সাবস্ক্রিপশন তথ্য আপডেট করা হয়েছে');
  };

  const addTeacher = async (data: NewTeacherData) => {
    // 1. Try API Call
    try {
      const res = await fetch(`${API_BASE}/teachers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (res.ok) {
        const result = await res.json();
        // Refresh list
        fetchFromAPI();
        toast.success(result.message || 'শিক্ষক যোগ করা হয়েছে');
        return true;
      }
    } catch (e) {
      // Fallback to Mock
    }

    // Mock Logic
    if (subscription.used_teacher_count >= subscription.teacher_limit) {
      toast.error('শিক্ষক যোগ করার সীমা অতিক্রম করেছে!');
      return false;
    }

    const newTeacher: Teacher = {
      id: Math.random().toString(36).substr(2, 9),
      name: data.name,
      email: data.email,
      username: data.username,
      parent_school_id: user?.id || 'unknown',
      joinedAt: new Date().toISOString(),
    };

    setTeachers(prev => [...prev, newTeacher]);
    setSubscription(prev => ({
      ...prev,
      used_teacher_count: prev.used_teacher_count + 1
    }));
    toast.success('শিক্ষক সফলভাবে যোগ করা হয়েছে (Local)');
    return true;
  };

  const removeTeacher = async (id: string) => {
    // 1. Try API
    try {
      const res = await fetch(`${API_BASE}/teachers/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        toast.success('শিক্ষক মুছে ফেলা হয়েছে');
        fetchFromAPI();
        return;
      }
    } catch(e) {
      // Fallback
    }

    // Mock
    setTeachers(prev => prev.filter(t => t.id !== id));
    setSubscription(prev => ({
      ...prev,
      used_teacher_count: Math.max(0, prev.used_teacher_count - 1)
    }));
    toast.success('শিক্ষককে অপসারণ করা হয়েছে (Local)');
  };

  return (
    <SubscriptionContext.Provider
      value={{
        user,
        subscription,
        teachers,
        login,
        updateSubscription,
        addTeacher,
        removeTeacher,
        isSubscriptionValid,
        canPerformAction,
        isLoading
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};
