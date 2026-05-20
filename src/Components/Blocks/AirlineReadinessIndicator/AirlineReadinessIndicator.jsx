import React from 'react';
import ReadinessIndicator from '../ReadinessIndicator/ReadinessIndicator';
import { computeAirlineReadiness } from '../../../utils/airlineReadiness';

function AirlineReadinessIndicator({ airline }) {
  const { done, total, groups } = computeAirlineReadiness(airline);
  return <ReadinessIndicator done={done} total={total} groups={groups} />;
}

export default AirlineReadinessIndicator;
