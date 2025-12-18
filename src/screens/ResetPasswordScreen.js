/**
 * Reset Password Screen
 * Allows user to set a new password after clicking the reset link
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Text from '../components/Text';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { supabase } from '../services/supabase';
import { showSuccessToast, showErrorToast } from '../components/Toast';

const ResetPasswordScreen = ({ navigation, route }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    checkResetSession();
  }, []);

  const checkResetSession = async () => {
    try {
      // Check if we have a valid session from the reset link
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (session) {
        setIsValidSession(true);
      } else {
        setIsValidSession(false);
      }
    } catch (error) {
      console.error('Error checking session:', error);
      setIsValidSession(false);
    } finally {
      setCheckingSession(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      showErrorToast('Preencha todos os campos');
      return;
    }

    if (newPassword.length < 6) {
      showErrorToast('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    if (newPassword !== confirmPassword) {
      showErrorToast('As senhas não coincidem');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      showSuccessToast('Senha alterada com sucesso!');
      
      // Sign out to force re-login with new password
      await supabase.auth.signOut();
      
      // Navigate back to auth
      navigation.reset({
        index: 0,
        routes: [{ name: 'Auth' }],
      });
    } catch (error) {
      console.error('Error resetting password:', error);
      showErrorToast(error.message || 'Erro ao alterar senha');
    } finally {
      setIsLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.botanical.dark} />
          <Text style={styles.loadingText}>Verificando sessão...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!isValidSession) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={colors.botanical.sage} />
          <Text style={styles.errorTitle}>Link Expirado</Text>
          <Text style={styles.errorText}>
            O link de recuperação expirou ou é inválido.{'\n'}
            Solicite um novo link de recuperação.
          </Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.navigate('Auth')}
          >
            <Text style={styles.backButtonText}>Voltar ao Login</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons name="key-outline" size={48} color={colors.botanical.dark} />
            </View>
            <Text style={styles.title}>Nova Senha</Text>
            <Text style={styles.subtitle}>
              Digite sua nova senha para acessar sua conta
            </Text>
          </View>

          {/* Form */}
          <View style={styles.formCard}>
            <View style={styles.inputWrapper}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={colors.botanical.sage}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Nova senha"
                placeholderTextColor={colors.botanical.sage}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={colors.botanical.sage}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.inputWrapper}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={colors.botanical.sage}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Confirmar nova senha"
                placeholderTextColor={colors.botanical.sage}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showPassword}
              />
            </View>

            <Text style={styles.hintText}>
              A senha deve ter pelo menos 6 caracteres
            </Text>

            <TouchableOpacity
              style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
              onPress={handleResetPassword}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.botanical.base} />
              ) : (
                <Text style={styles.submitButtonText}>Alterar Senha</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.botanical.base,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing['2xl'],
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 16,
    color: colors.botanical.sage,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.botanical.dark,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  errorText: {
    fontSize: 16,
    color: colors.botanical.sage,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xl,
  },
  backButton: {
    backgroundColor: colors.botanical.dark,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: 16,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.botanical.base,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing['2xl'],
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.botanical.sand,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.botanical.dark,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    color: colors.botanical.sage,
    textAlign: 'center',
  },
  formCard: {
    backgroundColor: colors.ui.background,
    borderRadius: 24,
    padding: spacing.xl,
    shadowColor: colors.botanical.dark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.botanical.sand,
    borderRadius: 16,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
  },
  inputIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    paddingVertical: spacing.md,
    fontSize: 16,
    color: colors.botanical.dark,
  },
  hintText: {
    fontSize: 12,
    color: colors.botanical.sage,
    marginBottom: spacing.lg,
    marginLeft: spacing.sm,
  },
  submitButton: {
    backgroundColor: colors.botanical.dark,
    borderRadius: 16,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.botanical.base,
  },
});

export default ResetPasswordScreen;
