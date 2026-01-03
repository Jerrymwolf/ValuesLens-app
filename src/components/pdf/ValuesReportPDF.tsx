'use client';

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer';

// Brand colors
const COLORS = {
  brand600: '#0268A0',
  brand700: '#015E8C',
  brand900: '#002233',
  accent500: '#8FD932',
  gray100: '#F3F4F6',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray900: '#111827',
  white: '#FFFFFF',
};

// Styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: COLORS.white,
    fontFamily: 'Helvetica',
  },
  titlePage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.brand600,
  },
  titleText: {
    fontSize: 42,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 40,
  },
  brandName: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    position: 'absolute',
    bottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.brand900,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.gray500,
  },
  valueCard: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: COLORS.gray100,
    borderRadius: 8,
  },
  valueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.brand600,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  valueName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.gray900,
  },
  tagline: {
    fontSize: 14,
    fontStyle: 'italic',
    color: COLORS.brand700,
    marginBottom: 8,
  },
  definition: {
    fontSize: 11,
    color: COLORS.gray600,
    lineHeight: 1.5,
    marginBottom: 10,
  },
  anchorsTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.gray500,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  anchor: {
    fontSize: 10,
    color: COLORS.brand600,
    marginBottom: 4,
  },
  frameworkSection: {
    marginTop: 20,
    padding: 20,
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
  },
  frameworkTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.brand900,
    marginBottom: 12,
  },
  frameworkText: {
    fontSize: 11,
    color: COLORS.gray600,
    lineHeight: 1.6,
    marginBottom: 8,
  },
  walletCardPage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  walletCard: {
    width: 340,
    height: 200,
    backgroundColor: COLORS.brand600,
    borderRadius: 12,
    padding: 20,
    justifyContent: 'space-between',
  },
  walletTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: 12,
  },
  walletValue: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  walletRank: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    width: 20,
  },
  walletValueName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.white,
    flex: 1,
  },
  walletFooter: {
    fontSize: 8,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
  },
  walletInstructions: {
    marginTop: 20,
    fontSize: 10,
    color: COLORS.gray500,
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 9,
    color: COLORS.gray500,
  },
});

interface ValueData {
  id: string;
  name: string;
  tagline: string;
  definition?: string;
  behavioralAnchors?: string[];
}

interface ValuesReportPDFProps {
  values: ValueData[];
  createdAt?: string;
}

export default function ValuesReportPDF({ values, createdAt }: ValuesReportPDFProps) {
  const dateStr = createdAt || new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Document>
      {/* Title Page */}
      <Page size="A4" style={[styles.page, styles.titlePage]}>
        <Text style={styles.titleText}>Your 2026</Text>
        <Text style={styles.titleText}>Values Report</Text>
        <Text style={styles.subtitle}>Personal values assessment results</Text>
        <Text style={styles.brandName}>ValuesLens.com</Text>
      </Page>

      {/* Values Pages */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Your Core Values</Text>
          <Text style={styles.headerSubtitle}>
            These are the values that matter most to you, ranked by importance
          </Text>
        </View>

        {values.slice(0, 3).map((value, index) => (
          <View key={value.id} style={styles.valueCard}>
            <View style={styles.valueHeader}>
              <View style={styles.rankBadge}>
                <Text style={styles.rankText}>{index + 1}</Text>
              </View>
              <Text style={styles.valueName}>{value.name}</Text>
            </View>

            <Text style={styles.tagline}>&ldquo;{value.tagline}&rdquo;</Text>

            {value.definition && (
              <Text style={styles.definition}>{value.definition}</Text>
            )}

            {value.behavioralAnchors && value.behavioralAnchors.length > 0 && (
              <View>
                <Text style={styles.anchorsTitle}>Decision Questions</Text>
                {value.behavioralAnchors.slice(0, 3).map((anchor, i) => (
                  <Text key={i} style={styles.anchor}>• {anchor}</Text>
                ))}
              </View>
            )}
          </View>
        ))}

        <Text style={styles.footer}>
          Generated on {dateStr} | ValuesLens.com
        </Text>
      </Page>

      {/* Additional Values + Framework */}
      {values.length > 3 && (
        <Page size="A4" style={styles.page}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Supporting Values</Text>
            <Text style={styles.headerSubtitle}>
              Your complete top 5 values
            </Text>
          </View>

          {values.slice(3, 5).map((value, index) => (
            <View key={value.id} style={styles.valueCard}>
              <View style={styles.valueHeader}>
                <View style={styles.rankBadge}>
                  <Text style={styles.rankText}>{index + 4}</Text>
                </View>
                <Text style={styles.valueName}>{value.name}</Text>
              </View>

              <Text style={styles.tagline}>&ldquo;{value.tagline}&rdquo;</Text>

              {value.definition && (
                <Text style={styles.definition}>{value.definition}</Text>
              )}
            </View>
          ))}

          {/* Decision Framework */}
          <View style={styles.frameworkSection}>
            <Text style={styles.frameworkTitle}>Your Decision Framework</Text>
            <Text style={styles.frameworkText}>
              When facing important decisions, use your values as a compass:
            </Text>
            <Text style={styles.frameworkText}>
              1. <Text style={{ fontWeight: 'bold' }}>Pause</Text> - Before reacting, take a moment to reflect.
            </Text>
            <Text style={styles.frameworkText}>
              2. <Text style={{ fontWeight: 'bold' }}>Check alignment</Text> - Does this choice honor {values[0]?.name || 'your #1 value'}?
            </Text>
            <Text style={styles.frameworkText}>
              3. <Text style={{ fontWeight: 'bold' }}>Consider impact</Text> - How does this affect what matters most to you?
            </Text>
            <Text style={styles.frameworkText}>
              4. <Text style={{ fontWeight: 'bold' }}>Act with intention</Text> - Choose the path that aligns with your values.
            </Text>
          </View>

          <Text style={styles.footer}>
            Generated on {dateStr} | ValuesLens.com
          </Text>
        </Page>
      )}

      {/* Wallet Card Page */}
      <Page size="A4" style={[styles.page, styles.walletCardPage]}>
        <Text style={[styles.headerTitle, { marginBottom: 20 }]}>
          Your Values Wallet Card
        </Text>
        <Text style={[styles.headerSubtitle, { marginBottom: 30, textAlign: 'center' }]}>
          Cut along the edges and keep in your wallet for daily reminders
        </Text>

        <View style={styles.walletCard}>
          <Text style={styles.walletTitle}>MY TOP 5 VALUES</Text>
          <View>
            {values.slice(0, 5).map((value, index) => (
              <View key={value.id} style={styles.walletValue}>
                <Text style={styles.walletRank}>#{index + 1}</Text>
                <Text style={styles.walletValueName}>{value.name}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.walletFooter}>valueslens.com</Text>
        </View>

        <Text style={styles.walletInstructions}>
          Print this page, cut out the card, and keep it somewhere visible.
        </Text>

        <Text style={styles.footer}>
          Generated on {dateStr} | ValuesLens.com
        </Text>
      </Page>
    </Document>
  );
}
