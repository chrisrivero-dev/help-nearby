'use client';

import type { FC } from 'react';
import TitleBase from './TitleBase';

interface TitleProps {
  title?: string;
  subtitle?: string;
  showMapPin?: boolean;
}

const AboutTitle: FC<TitleProps> = ({
  title = 'ABOUT! NEARBY.',
  showMapPin = true,
}) => {
  return (
    <TitleBase title={title} subtitle={undefined} showMapPin={showMapPin} />
  );
};

export default AboutTitle;
