import { supabase } from "@/lib/supabase";
import { AuthError, Session, User } from "@supabase/supabase-js";
import React, {
	createContext,
	ReactNode,
	useContext,
	useEffect,
	useState,
} from "react";
import { Alert } from "react-native";

interface AuthContextType {
	session: Session | null;
	user: User | null;
	loading: boolean;
	signUp: (email: string, password: string, name?: string) => Promise<void>;
	signIn: (email: string, password: string) => Promise<void>;
	signOut: () => Promise<void>;
	resetPassword: (email: string) => Promise<void>;
	updateProfile: (updates: {
		name?: string;
		avatar_url?: string;
	}) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
	const [session, setSession] = useState<Session | null>(null);
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		// Get initial session
		supabase.auth.getSession().then(({ data: { session } }) => {
			setSession(session);
			setUser(session?.user ?? null);
			setLoading(false);
		});

		// Listen for auth changes
		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((_event, session) => {
			setSession(session);
			setUser(session?.user ?? null);
			setLoading(false);
		});

		return () => subscription.unsubscribe();
	}, []);

	const signUp = async (email: string, password: string, name?: string) => {
		try {
			const { data, error } = await supabase.auth.signUp({
				email,
				password,
				options: {
					data: {
						name,
					},
				},
			});

			if (error) throw error;

			// Profile is automatically created by the database trigger (handle_new_user)
			// No need to manually insert into profiles table

			Alert.alert(
				"Success",
				"Account created! Please check your email to verify your account."
			);
		} catch (error) {
			const authError = error as AuthError;
			Alert.alert("Sign Up Error", authError.message);
			throw error;
		}
	};

	const signIn = async (email: string, password: string) => {
		try {
			const { error } = await supabase.auth.signInWithPassword({
				email,
				password,
			});

			if (error) throw error;
		} catch (error) {
			const authError = error as AuthError;
			Alert.alert("Sign In Error", authError.message);
			throw error;
		}
	};

	const signOut = async () => {
		try {
			const { error } = await supabase.auth.signOut();
			if (error) throw error;
		} catch (error) {
			const authError = error as AuthError;
			Alert.alert("Sign Out Error", authError.message);
			throw error;
		}
	};

	const resetPassword = async (email: string) => {
		try {
			const { error } = await supabase.auth.resetPasswordForEmail(email, {
				redirectTo: "100mindsmobile://reset-password",
			});

			if (error) throw error;

			Alert.alert(
				"Success",
				"Password reset email sent! Please check your inbox."
			);
		} catch (error) {
			const authError = error as AuthError;
			Alert.alert("Reset Password Error", authError.message);
			throw error;
		}
	};

	const updateProfile = async (updates: {
		name?: string;
		avatar_url?: string;
	}) => {
		if (!user) {
			throw new Error("No user logged in");
		}

		try {
			const { error } = await supabase
				.from("profiles")
				.update({
					...updates,
					updated_at: new Date().toISOString(),
				})
				.eq("id", user.id);

			if (error) throw error;

			// Update auth metadata if name changed
			if (updates.name) {
				const { error: metadataError } = await supabase.auth.updateUser({
					data: { name: updates.name },
				});

				if (metadataError) {
					console.error("Error updating user metadata:", metadataError);
				}
			}
		} catch (error) {
			const authError = error as AuthError;
			Alert.alert("Update Profile Error", authError.message);
			throw error;
		}
	};

	const value: AuthContextType = {
		session,
		user,
		loading,
		signUp,
		signIn,
		signOut,
		resetPassword,
		updateProfile,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
}
