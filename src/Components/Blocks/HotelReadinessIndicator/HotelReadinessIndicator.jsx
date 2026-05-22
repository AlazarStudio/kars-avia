import React from 'react';
import ReadinessIndicator from '../ReadinessIndicator/ReadinessIndicator';
import { computeHotelReadiness } from '../../../utils/hotelReadiness';

function HotelReadinessIndicator({ hotel }) {
  const { done, total, groups } = computeHotelReadiness(hotel);
  return <ReadinessIndicator done={done} total={total} groups={groups} />;
}

export default HotelReadinessIndicator;
