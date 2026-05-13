'use client';

import type { FC } from 'react';
import TitleBase from './TitleBase';

interface TitleProps {
  title?: string;
  subtitle?: string;
  showMapPin?: boolean;
}

const HelpTitle: FC<TitleProps> = ({
  title = 'HELP! NEARBY.',
  subtitle,
  showMapPin = true,
}) => {
  return (
    <TitleBase title={title} subtitle={subtitle} showMapPin={showMapPin} />
  );
};

export default HelpTitle;
