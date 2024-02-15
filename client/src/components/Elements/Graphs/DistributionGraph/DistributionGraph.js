import { Box, CardContent, MenuItem, Select, Typography, useMediaQuery } from '@mui/material';
import { useStyles } from './DistributionGraphMUI';
import {
  Bar,
  BarChart,
  Brush,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip as ChartTooltip,
  Label
} from 'recharts';
import { useAppDispatch, useAppSelector } from '../../../../stores/hooks';
import { setDistributionGraphView } from '../../../../stores/slices/graphSlice';
import { getColorForGenotype, hoverColor } from '../../../../util/colorHelper';
import { useEffect, useState } from 'react';

const dataViewOptions = [
  { label: 'Number of genomes', value: 'number' },
  { label: 'Percentage per year', value: 'percentage' }
];

export const DistributionGraph = () => {
  const classes = useStyles();
  const [plotChart, setPlotChart] = useState(() => {});
  const matches500 = useMediaQuery('(max-width:500px)');

  const dispatch = useAppDispatch();
  const distributionGraphView = useAppSelector((state) => state.graph.distributionGraphView);
  const genotypesYearData = useAppSelector((state) => state.graph.genotypesYearData);
  const genotypesForFilter = useAppSelector((state) => state.dashboard.genotypesForFilter);
  const canGetData = useAppSelector((state) => state.dashboard.canGetData);

  function getDomain() {
    return distributionGraphView === 'number' ? undefined : [0, 100];
  }

  function getData() {
    if (distributionGraphView === 'number') {
      return genotypesYearData;
    }

    const exclusions = ['name', 'count'];
    let genotypeDataPercentage = structuredClone(genotypesYearData);
    genotypeDataPercentage = genotypeDataPercentage.map((item) => {
      const keys = Object.keys(item).filter((x) => !exclusions.includes(x));

      keys.forEach((key) => {
        item[key] = Number(((item[key] / item.count) * 100).toFixed(2));
      });

      return item;
    });

    return genotypeDataPercentage;
  }

  function getTooltipData(label, payload) {
    const data = genotypesYearData.find((item) => item.name === label);

    if (data) {
      const tooltipData = [];

      payload.forEach((item) => {
        if (item.value === 0) {
          return;
        }

        const count = data[item.name];
        tooltipData.push({
          name: item.name,
          color: item.color,
          count,
          percentage: Number(((count / data.count) * 100).toFixed(2))
        });
      });

      tooltipData.sort((a, b) => b.name.localeCompare(a.name));
      return tooltipData;
    }
  }

  function handleChangeDataView(event) {
    dispatch(setDistributionGraphView(event.target.value));
  }

  useEffect(() => {
    if (canGetData) {
      setPlotChart(() => {
        return (
          <ResponsiveContainer width="100%">
            <BarChart data={getData()} maxBarSize={70}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" interval="preserveStartEnd" tick={{ fontSize: 14 }} />
              <YAxis domain={getDomain()} allowDataOverflow={true} allowDecimals={false}>
                <Label angle={-90} position="insideLeft" className={classes.graphLabel}>
                  {dataViewOptions.find((option) => option.value === distributionGraphView).label}
                </Label>
              </YAxis>
              {genotypesYearData.length > 0 && <Brush dataKey="name" height={20} stroke={'rgb(31, 187, 211)'} />}

              <Legend
                content={(props) => {
                  const { payload } = props;
                  return (
                    <div className={classes.legendWrapper}>
                      {payload.map((entry, index) => {
                        const { dataKey, color } = entry;
                        return (
                          <div key={`distribution-legend-${index}`} className={classes.legendItemWrapper}>
                            <Box className={classes.colorCircle} style={{ backgroundColor: color }} />
                            <Typography variant="caption">{dataKey}</Typography>
                          </div>
                        );
                      })}
                    </div>
                  );
                }}
              />

              <ChartTooltip
                position={{ x: matches500 ? 0 : 60, y: matches500 ? 310 : 410 }}
                // eslint-disable-next-line eqeqeq
                cursor={genotypesYearData!=0?{ fill: hoverColor }:false}
                wrapperStyle={{ outline: 'none', zIndex: 1 }}
                content={({ payload, active, label }) => {
                  if (payload.length !== 0 && active) {
                    const data = getTooltipData(label, payload);

                    return (
                      <div className={classes.tooltip}>
                        <div className={classes.tooltipTitle}>
                          <Typography variant="h5" fontWeight="600">
                            {label}
                          </Typography>
                          <Typography variant="subtitle1">{`N = ${payload[0].payload.count}`}</Typography>
                        </div>
                        <div className={classes.tooltipContent}>
                          {data.map((item, index) => {
                            return (
                              <div key={`tooltip-content-${index}`} className={classes.tooltipItemWrapper}>
                                <Box
                                  className={classes.tooltipItemBox}
                                  style={{
                                    backgroundColor: item.color
                                  }}
                                />
                                <div className={classes.tooltipItemStats}>
                                  <Typography variant="body2" fontWeight="500" lineHeight={undefined}>
                                    {item.name}
                                  </Typography>
                                  <Typography
                                    fontSize="12px"
                                    noWrap
                                    lineHeight={undefined}
                                  >{`N = ${item.count}`}</Typography>
                                  <Typography
                                    fontSize="10px"
                                    lineHeight={undefined}
                                  >{`${item.percentage}%`}</Typography>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />

              {genotypesForFilter.map((option, index) => (
                <Bar
                  key={`distribution-bar-${index}`}
                  dataKey={option}
                  name={option}
                  stackId={0}
                  fill={getColorForGenotype(option)}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [genotypesYearData, distributionGraphView, matches500]);

  return (
    <CardContent className={classes.distributionGraph}>
      <div className={classes.selectWrapper}>
        <Typography variant="caption" className={classes.selectLabel}>
          Data view
        </Typography>
        <Select
          className={classes.select}
          value={distributionGraphView}
          onChange={handleChangeDataView}
          inputProps={{ className: classes.selectInput }}
          MenuProps={{ classes: { list: classes.selectMenu } }}
        >
          {dataViewOptions.map((option, index) => {
            return (
              <MenuItem key={index + 'distribution-dataview'} value={option.value}>
                {option.label}
              </MenuItem>
            );
          })}
        </Select>
      </div>
      <div className={classes.graphWrapper}>
        <div className={classes.graph} id="GD">
          {plotChart}
        </div>
      </div>
    </CardContent>
  );
};
