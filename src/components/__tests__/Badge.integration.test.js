import React from 'react';
import { render } from '@testing-library/react-native';
import Badge from '../Badge';

describe('Badge Integration Tests', () => {
  it('displays earned badge with colorful appearance', () => {
    const { getByText } = render(
      <Badge 
        badgeId="water_master"
        isEarned={true}
      />
    );

    // Should display the badge name
    expect(getByText('Mestre da Água')).toBeTruthy();
  });

  it('displays locked badge with grayed out appearance', () => {
    const { getByText } = render(
      <Badge 
        badgeId="community_star"
        isEarned={false}
      />
    );

    // Should display the badge name even when locked
    expect(getByText('Estrela da Comunidade')).toBeTruthy();
  });

  it('supports custom badge configuration', () => {
    const { getByText } = render(
      <Badge 
        name="Custom Achievement"
        icon="medal"
        color="#FF6B35"
        isEarned={true}
      />
    );

    expect(getByText('Custom Achievement')).toBeTruthy();
  });

  it('supports different sizes', () => {
    const { getByText: getSmall } = render(
      <Badge 
        name="Small Badge"
        size="small"
        isEarned={true}
      />
    );

    const { getByText: getLarge } = render(
      <Badge 
        name="Large Badge"
        size="large"
        isEarned={true}
      />
    );

    expect(getSmall('Small Badge')).toBeTruthy();
    expect(getLarge('Large Badge')).toBeTruthy();
  });
});