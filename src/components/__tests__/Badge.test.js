import React from 'react';
import { render } from '@testing-library/react-native';
import Badge from '../Badge';

// Mock the theme files
jest.mock('../../theme/shadows', () => ({
  componentShadows: {
    plantCard: {},
  },
}));

describe('Badge', () => {
  it('renders correctly with earned badge', () => {
    const { getByText } = render(
      <Badge 
        name="Test Badge"
        icon="star"
        color="#059669"
        isEarned={true}
      />
    );

    expect(getByText('Test Badge')).toBeTruthy();
  });

  it('renders correctly with locked badge', () => {
    const { getByText } = render(
      <Badge 
        name="Locked Badge"
        icon="trophy"
        color="#059669"
        isEarned={false}
      />
    );

    expect(getByText('Locked Badge')).toBeTruthy();
  });

  it('renders correctly with predefined badge ID', () => {
    const { getByText } = render(
      <Badge 
        badgeId="first_sprout"
        isEarned={true}
      />
    );

    expect(getByText('Primeiro Broto')).toBeTruthy();
  });

  it('renders correctly with different sizes', () => {
    const { getByText } = render(
      <Badge 
        name="Small Badge"
        icon="star"
        color="#059669"
        isEarned={true}
        size="small"
      />
    );

    expect(getByText('Small Badge')).toBeTruthy();
  });

  it('falls back to default values when no props provided', () => {
    const { getByText } = render(
      <Badge />
    );

    expect(getByText('Badge')).toBeTruthy();
  });

  it('prioritizes badgeId over individual props', () => {
    const { getByText } = render(
      <Badge 
        badgeId="water_master"
        name="Should Not Show"
        isEarned={true}
      />
    );

    // Should show the predefined name from badgeId, not the name prop
    expect(getByText('Mestre da Água')).toBeTruthy();
  });
});