import React from 'react';

export default function Image(props: Record<string, unknown>) {
  const { fill: _fill, priority: _priority, ...rest } = props;
  return <img alt="" {...rest} />;
}