import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

class SimpleErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Algo deu errado</Text>
          <Text style={styles.message}>
            {this.state.error?.message || 'Erro desconhecido'}
          </Text>
          <TouchableOpacity 
            style={styles.button}
            onPress={() => this.setState({ hasError: false, error: null })}
          >
            <Text style={styles.buttonText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F7F5F0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E4A3D',
    marginBottom: 10,
  },
  message: {
    fontSize: 14,
    color: '#8DA397',
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#B85C38',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  buttonText: {
    color: '#F7F5F0',
    fontWeight: '600',
  },
});

export default SimpleErrorBoundary;