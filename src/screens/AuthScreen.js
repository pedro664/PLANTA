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
  const { signIn, signUp, isLoading } = useAppContext();
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });

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

  const handleSubmit = async () => {
    try {
      if (isSignUp) {
        await signUp(formData.email, formData.password, {
          name: formData.name,
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
    setFormData({ name: '', email: '', password: '' });
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
            <Text style={styles.title}>Educultivo</Text>
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

});

export default AuthScreen;