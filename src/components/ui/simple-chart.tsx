'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface SimpleChartProps {
  title: string;
  description?: string;
  data: Array<{
    label: string;
    value: number;
    color?: string;
  }>;
  type?: 'bar' | 'line' | 'pie';
  height?: number;
}

export function SimpleChart({ 
  title, 
  description, 
  data, 
  type = 'bar'
}: SimpleChartProps) {
  const maxValue = Math.max(...data.map(d => d.value));
  const colors = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', 
    '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1'
  ];

  if (type === 'pie') {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    let cumulativePercentage = 0;

    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center">
            <div className="relative w-48 h-48">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                {data.map((item, index) => {
                  const percentage = (item.value / total) * 100;
                  const startAngle = (cumulativePercentage / 100) * 360;
                  const endAngle = ((cumulativePercentage + percentage) / 100) * 360;
                  cumulativePercentage += percentage;

                  const radius = 40;
                  const centerX = 50;
                  const centerY = 50;
                  
                  const startAngleRad = (startAngle - 90) * (Math.PI / 180);
                  const endAngleRad = (endAngle - 90) * (Math.PI / 180);
                  
                  const x1 = centerX + radius * Math.cos(startAngleRad);
                  const y1 = centerY + radius * Math.sin(startAngleRad);
                  const x2 = centerX + radius * Math.cos(endAngleRad);
                  const y2 = centerY + radius * Math.sin(endAngleRad);
                  
                  const largeArcFlag = percentage > 50 ? 1 : 0;
                  
                  const pathData = [
                    `M ${centerX} ${centerY}`,
                    `L ${x1} ${y1}`,
                    `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                    'Z'
                  ].join(' ');

                  return (
                    <path
                      key={index}
                      d={pathData}
                      fill={colors[index % colors.length]}
                      stroke="white"
                      strokeWidth="1"
                    />
                  );
                })}
              </svg>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {data.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: colors[index % colors.length] }}
                  />
                  <span className="text-sm">{item.label}</span>
                </div>
                <span className="text-sm font-medium">
                  {((item.value / total) * 100).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (type === 'line') {
    const points = data.map((item, index) => {
      const x = (index / (data.length - 1)) * 100;
      const y = 100 - (item.value / maxValue) * 100;
      return `${x},${y}`;
    }).join(' ');

    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <div className="h-48 w-full">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <polyline
                fill="none"
                stroke={colors[0]}
                strokeWidth="2"
                points={points}
              />
              {data.map((item, index) => {
                const x = (index / (data.length - 1)) * 100;
                const y = 100 - (item.value / maxValue) * 100;
                return (
                  <circle
                    key={index}
                    cx={x}
                    cy={y}
                    r="2"
                    fill={colors[0]}
                  />
                );
              })}
            </svg>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {data.map((item, index) => (
              <div key={index} className="text-center">
                <div className="text-sm font-medium">{item.label}</div>
                <div className="text-xs text-muted-foreground">{item.value}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Bar chart (default)
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="h-48 w-full">
          <div className="flex items-end justify-between h-full space-x-1">
            {data.map((item, index) => {
              const barHeight = (item.value / maxValue) * 100;
              return (
                <div key={index} className="flex flex-col items-center flex-1">
                  <div
                    className="w-full rounded-t"
                    style={{
                      height: `${barHeight}%`,
                      backgroundColor: colors[index % colors.length],
                      minHeight: item.value > 0 ? '4px' : '0px',
                    }}
                  />
                  <div className="mt-2 text-xs text-center">
                    <div className="font-medium">{item.value}</div>
                    <div className="text-muted-foreground truncate max-w-16">
                      {item.label}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
