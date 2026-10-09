import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import Svg, { Path, Rect, Line } from 'react-native-svg';
import UIcon from './UIcon';

export default function GradeCurveVisualizer({ grades = [], onApplyCurve, onClose }) {
  const [curveOffset, setCurveOffset] = useState('');

  // Statistical calculations (Mean, Standard Deviation, etc.)
  const stats = useMemo(() => {
    const scores = grades.map(g => {
      const s = parseFloat(g.score);
      return isNaN(s) ? 0 : s;
    }).filter(s => s > 0);

    const count = scores.length || 1;
    const mean = scores.reduce((a, b) => a + b, 0) / count;
    const variance = scores.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / count;
    const stdDev = Math.sqrt(variance) || 1; // Prevent division by zero
    return { mean, stdDev, count: scores.length };
  }, [grades]);

  // Handle saving the curve
  const handleApply = () => {
    const offset = parseFloat(curveOffset) || 0;
    if (onApplyCurve) onApplyCurve(offset);
  };

  const chartWidth = 340;
  const chartHeight = 160;

  // Generate a Normal Distribution (Bell Curve) Path
  const generateBellCurvePath = () => {
    if (stats.count === 0) return '';
    const points = [];
    // We'll plot from mean - 3*stdDev to mean + 3*stdDev
    const minX = Math.max(0, stats.mean - 3 * stats.stdDev);
    const maxX = Math.min(100, stats.mean + 3 * stats.stdDev);

    for (let i = 0; i <= 100; i += 1) {
      const x = i;
      // Normal distribution probability density function (simplified for visual scale)
      const exponent = -Math.pow(x - stats.mean, 2) / (2 * Math.pow(stats.stdDev, 2));
      const y = (1 / (stats.stdDev * Math.sqrt(2 * Math.PI))) * Math.exp(exponent);

      // Scale to SVG coords (x: 0-100 maps to 0-chartWidth)
      const svgX = (x / 100) * chartWidth;
      // Scale y to chartHeight (arbitrary multiplier to make it look like a bell)
      const svgY = chartHeight - (y * chartHeight * stats.stdDev * 2.5); 
      
      points.push(`${i === 0 ? 'M' : 'L'} ${svgX} ${Math.min(chartHeight, Math.max(0, svgY))}`);
    }
    return points.join(' ');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <UIcon name="chart" size={20} color="#312E81" style={{ marginRight: 8 }} />
          <Text style={styles.title}>Grade Curve Normalization</Text>
        </View>
        {onClose && (
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <UIcon name="x" size={16} color="#64748B" />
          </TouchableOpacity>
        )}
      </View>
      
      {/* Chart Canvas */}
      <View style={styles.chartWrapper}>
         <Svg height={chartHeight} width={chartWidth} viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
           {/* Grid lines */}
           <Line x1="0" y1={chartHeight} x2={chartWidth} y2={chartHeight} stroke="#E2E8F0" strokeWidth="2" />
           <Line x1={chartWidth/2} y1="0" x2={chartWidth/2} y2={chartHeight} stroke="#E2E8F0" strokeWidth="1" strokeDasharray="4 4" />
           
           {/* Bell Curve */}
           {stats.count > 0 && (
             <Path 
               d={generateBellCurvePath()}
               fill="rgba(79, 70, 229, 0.2)"
               stroke="#4F46E5"
               strokeWidth="3"
             />
           )}
           
           {/* Mean Indicator */}
           {stats.count > 0 && (
             <Line 
               x1={(stats.mean / 100) * chartWidth} 
               y1="0" 
               x2={(stats.mean / 100) * chartWidth} 
               y2={chartHeight} 
               stroke="#DC2626" 
               strokeWidth="2" 
               strokeDasharray="4 4"
             />
           )}
         </Svg>
         
         <View style={styles.axisLabels}>
            <Text style={styles.axisText}>0</Text>
            <Text style={styles.axisText}>50</Text>
            <Text style={styles.axisText}>100</Text>
         </View>
      </View>
      
      {/* Statistics Row */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Current Mean</Text>
          <Text style={styles.statValue}>{stats.mean.toFixed(1)}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Std Deviation</Text>
          <Text style={styles.statValue}>{stats.stdDev.toFixed(1)}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Total Grades</Text>
          <Text style={styles.statValue}>{stats.count}</Text>
        </View>
      </View>

      {/* Adjustment Controls */}
      <View style={styles.controlsSection}>
        <Text style={styles.controlsTitle}>Apply Curve Adjustment</Text>
        <View style={styles.controlsRow}>
          <TextInput 
            style={styles.inputField}
            value={curveOffset} 
            onChangeText={setCurveOffset} 
            keyboardType="numbers-and-punctuation" 
            placeholder="+5 points"
            placeholderTextColor="#9CA3AF"
          />
          <TouchableOpacity style={styles.applyBtn} onPress={handleApply}>
             <Text style={styles.applyBtnText}>Apply Curve to All</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.helperText}>
          Entering an offset (e.g., 5 or -2) will shift the entire distribution to normalize grades across the section.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  closeBtn: {
    padding: 4,
  },
  chartWrapper: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  axisLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 8,
    paddingHorizontal: 5,
  },
  axisText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#EEF2FF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4F46E5',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#312E81',
  },
  controlsSection: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 16,
  },
  controlsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 10,
  },
  controlsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  inputField: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '600',
  },
  applyBtn: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  applyBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  helperText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 8,
    lineHeight: 16,
  },
});
