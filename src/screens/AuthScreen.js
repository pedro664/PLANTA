/**
 * Professional Authentication Screen
 * Botanical-themed login/signup screen matching app's visual identity
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Image,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  Easing,
  Dimensions,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Text from '../components/Text';
import { useAppContext } from '../context/AppContext';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { textStyles } from '../theme/typography';

const { width, height } = Dimensions.get('window');

const AuthScreen = () => {
  const { signIn, signUp, resetPassword, isLoading } = useAppContext();
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
  });
  const [usernameError, setUsernameError] = useState('');
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetEmailSent, setResetEmailSent] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  
  // Floating elements animations
  const leaf1Float = useRef(new Animated.Value(0)).current;
  const leaf2Float = useRef(new Animated.Value(0)).current;
  const leaf3Float = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.back(1.1)),
        useNativeDriver: true,
      }),
      Animated.timing(logoScale, {
        toValue: 1,
        duration: 1000,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }),
    ]).start();

    // Start floating animations
    startFloatingAnimations();
  }, []);

  const startFloatingAnimations = () => {
    // Leaf 1 floating animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(leaf1Float, {
          toValue: -15,
          duration: 3000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(leaf1Float, {
          toValue: 0,
          duration: 3000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Leaf 2 floating animation (delayed)
    setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(leaf2Float, {
            toValue: -20,
            duration: 4000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(leaf2Float, {
            toValue: 0,
            duration: 4000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      ).start();
    }, 1000);

    // Leaf 3 floating animation (delayed)
    setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(leaf3Float, {
            toValue: -12,
            duration: 2500,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(leaf3Float, {
            toValue: 0,
            duration: 2500,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      ).start();
    }, 1500);
  };

  const checkUsernameAvailability = async (username) => {
    if (!username || username.length < 3) {
      setUsernameError('');
      return;
    }

    setIsCheckingUsername(true);
    setUsernameError('');

    try {
      const { userService } = await import('../services/userService');
      const isAvailable = await userService.checkUsernameAvailability(username);
      
      if (!isAvailable) {
        setUsernameError('Este username já está em uso');
      }
    } catch (error) {
      console.error('Erro ao verificar username:', error);
      setUsernameError('Erro ao verificar username');
    } finally {
      setIsCheckingUsername(false);
    }
  };

  const handleUsernameChange = (text) => {
    const cleanUsername = text.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setFormData(prev => ({ ...prev, username: cleanUsername }));
    
    // Debounce username check
    if (cleanUsername.length >= 3) {
      setTimeout(() => {
        if (formData.username === cleanUsername) {
          checkUsernameAvailability(cleanUsername);
        }
      }, 500);
    } else {
      setUsernameError('');
    }
  };

  const handleSubmit = async () => {
    try {
      if (isSignUp) {
        // Validar username antes de criar conta
        if (!formData.username || formData.username.length < 3) {
          setUsernameError('Username deve ter pelo menos 3 caracteres');
          return;
        }
        
        if (usernameError) {
          return; // Não prosseguir se há erro de username
        }

        await signUp(formData.email, formData.password, {
          name: formData.name,
          username: formData.username,
        });
      } else {
        await signIn(formData.email, formData.password);
      }
    } catch (error) {
      console.error('Auth error:', error);
    }
  };

  const toggleMode = () => {
    // Animate form transition
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0.7,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    setIsSignUp(!isSignUp);
    setFormData({ name: '', username: '', email: '', password: '' });
    setUsernameError('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Floating botanical elements */}
        <Animated.View style={[styles.floatingLeaf1, { 
          transform: [{ translateY: leaf1Float }] 
        }]}>
          <Ionicons name="leaf" size={32} color={colors.botanical.sage} style={styles.leafFloating} />
        </Animated.View>
        
        <Animated.View style={[styles.floatingLeaf2, { 
          transform: [{ translateY: leaf2Float }] 
        }]}>
          <Ionicons name="flower" size={24} color={colors.botanical.sage} style={styles.leafFloating} />
        </Animated.View>
        
        <Animated.View style={[styles.floatingLeaf3, { 
          transform: [{ translateY: leaf3Float }] 
        }]}>
          <Ionicons name="rose" size={28} color={colors.botanical.sage} style={styles.leafFloating} />
        </Animated.View>

        <ScrollView 
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Header with logo */}
          <Animated.View style={[styles.header, { 
            opacity: fadeAnim,
            transform: [
              { translateY: slideAnim },
              { scale: logoScale }
            ]
          }]}>
            <View style={styles.logoContainer}>
              <View style={styles.logoBackground}>
                <Image 
                  source={require('../../assets/logo-loading.png')} 
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </View>
            </View>
            <Text style={styles.title}>EduCultivo</Text>
            <Text style={styles.subtitle}>Cultive seu jardim digital</Text>
          </Animated.View>

          {/* Form container */}
          <Animated.View style={[styles.formContainer, { 
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }]}>
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>
                {isSignUp ? 'Criar Conta' : 'Bem-vindo de volta'}
              </Text>
              
              <Text style={styles.formSubtitle}>
                {isSignUp 
                  ? 'Junte-se à nossa comunidade de jardineiros' 
                  : 'Entre para cuidar das suas plantas'
                }
              </Text>

              {/* Form inputs */}
              <View style={styles.inputContainer}>
                {isSignUp && (
                  <>
                    <View style={styles.inputWrapper}>
                      <Ionicons name="person-outline" size={20} color={colors.botanical.sage} style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Nome completo"
                        placeholderTextColor={colors.botanical.sage}
                        value={formData.name}
                        onChangeText={(text) =>
                          setFormData((prev) => ({ ...prev, name: text }))
                        }
                        autoCapitalize="words"
                      />
                    </View>

                    <View style={[styles.inputWrapper, usernameError && styles.inputWrapperError]}>
                      <Text style={styles.usernamePrefix}>@</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="seu_username"
                        placeholderTextColor={colors.botanical.sage}
                        value={formData.username}
                        onChangeText={handleUsernameChange}
                        autoCapitalize="none"
                        autoCorrect={false}
                        maxLength={20}
                      />
                      {isCheckingUsername && (
                        <Ionicons name="time-outline" size={16} color={colors.botanical.sage} />
                      )}
                      {!isCheckingUsername && formData.username.length >= 3 && !usernameError && (
                        <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                      )}
                    </View>
                    
                    {usernameError ? (
                      <Text style={styles.errorText}>{usernameError}</Text>
                    ) : formData.username.length > 0 && formData.username.length < 3 ? (
                      <Text style={styles.hintText}>Mínimo 3 caracteres</Text>
                    ) : (
                      <Text style={styles.hintText}>3-20 caracteres: letras, números e _</Text>
                    )}
                  </>
                )}

                <View style={styles.inputWrapper}>
                  <Ionicons name="mail-outline" size={20} color={colors.botanical.sage} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Email"
                    placeholderTextColor={colors.botanical.sage}
                    value={formData.email}
                    onChangeText={(text) =>
                      setFormData((prev) => ({ ...prev, email: text }))
                    }
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.inputWrapper}>
                  <Ionicons name="lock-closed-outline" size={20} color={colors.botanical.sage} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Senha"
                    placeholderTextColor={colors.botanical.sage}
                    value={formData.password}
                    onChangeText={(text) =>
                      setFormData((prev) => ({ ...prev, password: text }))
                    }
                    secureTextEntry
                  />
                </View>
              </View>

              {/* Submit button */}
              <TouchableOpacity
                style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <View style={styles.loadingContainer}>
                    <Text style={styles.submitButtonText}>Carregando...</Text>
                  </View>
                ) : (
                  <Text style={styles.submitButtonText}>
                    {isSignUp ? 'Criar Conta' : 'Entrar'}
                  </Text>
                )}
              </TouchableOpacity>

              {/* Forgot password link - only show on login */}
              {!isSignUp && (
                <TouchableOpacity 
                  style={styles.forgotPasswordButton} 
                  onPress={() => {
                    setResetEmail(formData.email);
                    setShowForgotPassword(true);
                  }}
                >
                  <Text style={styles.forgotPasswordText}>Esqueci minha senha</Text>
                </TouchableOpacity>
              )}

              {/* Toggle mode */}
              <TouchableOpacity style={styles.toggleButton} onPress={toggleMode}>
                <Text style={styles.toggleText}>
                  {isSignUp
                    ? 'Já tem uma conta? '
                    : 'Não tem conta? '}
                  <Text style={styles.toggleTextBold}>
                    {isSignUp ? 'Entrar' : 'Criar uma'}
                  </Text>
                </Text>
              </TouchableOpacity>
            </View>


          </Animated.View>
        </ScrollView>

        {/* Forgot Password Modal */}
        <Modal
          visible={showForgotPassword}
          transparent
          animationType="fade"
          onRequestClose={() => {
            setShowForgotPassword(false);
            setResetEmailSent(false);
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              {resetEmailSent ? (
                // Success state - email sent
                <>
                  <View style={styles.modalHeader}>
                    <View style={styles.successIconContainer}>
                      <Ionicons name="mail-open-outline" size={48} color={colors.botanical.dark} />
                    </View>
                    <Text style={styles.modalTitle}>Email Enviado!</Text>
                    <Text style={styles.modalSubtitle}>
                      Enviamos um link de recuperação para:{'\n'}
                      <Text style={styles.emailHighlight}>{resetEmail}</Text>
                    </Text>
                  </View>

                  <View style={styles.instructionsContainer}>
                    <View style={styles.instructionItem}>
                      <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                      <Text style={styles.instructionText}>Verifique sua caixa de entrada</Text>
                    </View>
                    <View style={styles.instructionItem}>
                      <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                      <Text style={styles.instructionText}>Clique no link do email</Text>
                    </View>
                    <View style={styles.instructionItem}>
                      <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                      <Text style={styles.instructionText}>Crie sua nova senha</Text>
                    </View>
                  </View>

                  <Text style={styles.spamNote}>
                    Não recebeu? Verifique a pasta de spam.
                  </Text>

                  <TouchableOpacity
                    style={styles.modalSubmitButton}
                    onPress={() => {
                      setShowForgotPassword(false);
                      setResetEmailSent(false);
                      setResetEmail('');
                    }}
                  >
                    <Text style={styles.modalSubmitText}>Entendi</Text>
                  </TouchableOpacity>
                </>
              ) : (
                // Input state - enter email
                <>
                  <View style={styles.modalHeader}>
                    <Ionicons name="key-outline" size={40} color={colors.botanical.dark} />
                    <Text style={styles.modalTitle}>Recuperar Senha</Text>
                    <Text style={styles.modalSubtitle}>
                      Digite seu email e enviaremos um link para redefinir sua senha
                    </Text>
                  </View>

                  <View style={styles.modalInputWrapper}>
                    <Ionicons name="mail-outline" size={20} color={colors.botanical.sage} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Seu email"
                      placeholderTextColor={colors.botanical.sage}
                      value={resetEmail}
                      onChangeText={setResetEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoFocus
                    />
                  </View>

                  <View style={styles.modalButtons}>
                    <TouchableOpacity
                      style={styles.modalCancelButton}
                      onPress={() => {
                        setShowForgotPassword(false);
                        setResetEmail('');
                      }}
                    >
                      <Text style={styles.modalCancelText}>Cancelar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.modalSubmitButton, (isLoading || !resetEmail.trim()) && styles.submitButtonDisabled]}
                      onPress={async () => {
                        if (!resetEmail.trim()) return;
                        try {
                          await resetPassword(resetEmail.trim());
                          setResetEmailSent(true);
                        } catch (error) {
                          // Error already handled in context
                        }
                      }}
                      disabled={isLoading || !resetEmail.trim()}
                    >
                      <Text style={styles.modalSubmitText}>
                        {isLoading ? 'Enviando...' : 'Enviar'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </View>
        </Modal>
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
    paddingTop: spacing.xl,
  },

  // Floating elements
  floatingLeaf1: {
    position: 'absolute',
    top: height * 0.1,
    right: width * 0.1,
    zIndex: 1,
  },
  floatingLeaf2: {
    position: 'absolute',
    top: height * 0.3,
    left: width * 0.05,
    zIndex: 1,
  },
  floatingLeaf3: {
    position: 'absolute',
    bottom: height * 0.2,
    right: width * 0.08,
    zIndex: 1,
  },
  leafFloating: {
    opacity: 0.15,
  },

  // Header
  header: {
    alignItems: 'center',
    marginBottom: spacing['2xl'],
    paddingTop: spacing.lg,
  },
  logoContainer: {
    marginBottom: spacing.lg,
  },
  logoBackground: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.botanical.dark,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.botanical.dark,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    padding: spacing.md,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    fontStyle: 'italic',
    color: colors.botanical.dark,
    marginBottom: spacing.xs,
    textAlign: 'center',
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    fontStyle: 'italic',
    color: colors.botanical.sage,
    textAlign: 'center',
  },

  // Form
  formContainer: {
    flex: 1,
  },
  formCard: {
    backgroundColor: colors.ui.background,
    borderRadius: 24,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    shadowColor: colors.botanical.dark,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.botanical.dark,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  formSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.botanical.sage,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 20,
  },
  
  // Inputs
  inputContainer: {
    marginBottom: spacing.lg,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.botanical.sand,
    borderRadius: 16,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    paddingVertical: spacing.md,
    fontSize: 16,
    color: colors.botanical.dark,
    fontWeight: '400',
  },
  inputWrapperError: {
    borderColor: '#FF5252',
    borderWidth: 1,
  },
  usernamePrefix: {
    fontSize: 16,
    color: colors.botanical.sage,
    fontWeight: '600',
    marginRight: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#FF5252',
    marginTop: -spacing.sm,
    marginBottom: spacing.sm,
    marginLeft: spacing.md,
  },
  hintText: {
    fontSize: 12,
    color: colors.botanical.sage,
    marginTop: -spacing.sm,
    marginBottom: spacing.sm,
    marginLeft: spacing.md,
  },

  // Buttons
  submitButton: {
    backgroundColor: colors.botanical.dark,
    borderRadius: 16,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    shadowColor: colors.botanical.dark,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: colors.botanical.sage,
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.botanical.base,
    letterSpacing: 0.5,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // Toggle
  toggleButton: {
    alignItems: 'center',
  },
  toggleText: {
    fontSize: 14,
    color: colors.botanical.sage,
    textAlign: 'center',
  },
  toggleTextBold: {
    fontWeight: '700',
    color: colors.botanical.dark,
  },

  // Forgot Password
  forgotPasswordButton: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: colors.botanical.sage,
    textDecorationLine: 'underline',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.ui.background,
    borderRadius: 24,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 400,
    shadowColor: colors.botanical.dark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.botanical.dark,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.botanical.sage,
    textAlign: 'center',
    lineHeight: 20,
  },
  modalInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.botanical.sand,
    borderRadius: 16,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: 16,
    alignItems: 'center',
    backgroundColor: colors.botanical.sand,
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.botanical.sage,
  },
  modalSubmitButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: 16,
    alignItems: 'center',
    backgroundColor: colors.botanical.dark,
  },
  modalSubmitText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.botanical.base,
  },

  // Success state styles
  successIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.botanical.sand,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  emailHighlight: {
    fontWeight: '700',
    color: colors.botanical.dark,
  },
  instructionsContainer: {
    backgroundColor: colors.botanical.sand,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  instructionText: {
    fontSize: 14,
    color: colors.botanical.dark,
    marginLeft: spacing.sm,
  },
  spamNote: {
    fontSize: 12,
    color: colors.botanical.sage,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },

});

export default AuthScreen;