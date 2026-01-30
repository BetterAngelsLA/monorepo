import {
  HMIS_AUTH_COOKIE_NAME,
  HMIS_API_URL_STORAGE_KEY,
  SESSION_COOKIE_NAME,
} from '@monorepo/expo/shared/utils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import NitroCookies from 'react-native-nitro-cookies';
import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import { Button, TextBold, TextRegular } from '@monorepo/expo/shared/ui-components';
import { getSessionManager, useApiConfig } from '@monorepo/expo/shared/clients';
import { MainContainer } from '../../ui-components';

export function SessionDebug() {
  const { baseUrl } = useApiConfig();
  const [sessionExpiry, setSessionExpiry] = useState<string>('');
  const [hmisExpiry, setHmisExpiry] = useState<string>('');
  const [result, setResult] = useState<string>('');

  const checkCookies = async () => {
    try {
      const backendUrl = baseUrl;
      const hmisUrl = await AsyncStorage.getItem(HMIS_API_URL_STORAGE_KEY);

      let info = '';

      if (backendUrl) {
        const cookies = await NitroCookies.get(backendUrl);
        const sessionCookie = cookies[SESSION_COOKIE_NAME];
        if (sessionCookie) {
          info += `Django Session Cookie:\n`;
          info += `  Value: ${sessionCookie.value ? 'present' : 'missing'}\n`;
          info += `  Expires: ${sessionCookie.expires || 'no expiry'}\n\n`;
          setSessionExpiry(sessionCookie.expires || '');
        } else {
          info += `Django Session Cookie: not found\n\n`;
        }
      }

      if (hmisUrl) {
        const cookies = await NitroCookies.get(hmisUrl);
        const hmisCookie = cookies[HMIS_AUTH_COOKIE_NAME];
        if (hmisCookie) {
          info += `HMIS Cookie:\n`;
          info += `  Value: ${hmisCookie.value ? 'present' : 'missing'}\n`;
          
          // Decode JWT to get actual expiry
          if (hmisCookie.value) {
            try {
              const payload = hmisCookie.value.split('.')[1];
              const decoded = JSON.parse(atob(payload));
              if (decoded.exp) {
                const jwtExpiry = new Date(decoded.exp * 1000).toISOString();
                info += `  JWT Expires: ${jwtExpiry}\n`;
                setHmisExpiry(jwtExpiry);
              }
            } catch (e) {
              info += `  JWT decode failed\n`;
            }
          }
          
          info += `  Cookie Expires: ${hmisCookie.expires || 'no expiry'}\n`;
        } else {
          info += `HMIS Cookie: not found\n`;
        }
      }

      setResult(info || 'No cookies found');
    } catch (error) {
      setResult(`Error: ${error}`);
    }
  };

  const expireSession = async () => {
    try {
      const manager = getSessionManager();
      if (manager) {
        manager.triggerExpirationForTesting();
        setResult('✓ Session expiration triggered\nShould navigate to /auth and clear cookies');
      } else {
        setResult('✗ Session manager not initialized');
      }
    } catch (error) {
      console.error('[SessionDebug] Error:', error);
      setResult(`✗ Error: ${error}`);
    }
  };

  const expireHmis = async () => {
    try {
      const manager = getSessionManager();
      if (manager) {
        manager.triggerExpirationForTesting();
        setResult('✓ HMIS expiration triggered\nShould navigate to /auth and clear cookies');
      } else {
        setResult('✗ Session manager not initialized');
      }
    } catch (error) {
      setResult(`✗ Error: ${error}`);
    }
  };

  return (
    <MainContainer>
      <ScrollView style={styles.container}>
        <View style={styles.section}>
          <TextBold fontSize="lg">Session Monitor Debug</TextBold>
          <TextRegular fontSize="sm" color={Colors.NEUTRAL_DARK}>
            Test session expiration monitoring. Note: Cannot modify httpOnly cookies,
            so "Expire Now" buttons simulate expiration by directly triggering the handler.
          </TextRegular>
        </View>

        <View style={styles.section}>
          <Button
            title="Check Current Cookies"
            onPress={checkCookies}
            variant="primary"
            mb="xs"
            size="full"
          />
          <Button
            title="Trigger Session Expiration"
            onPress={expireSession}
            variant="primary"
            mb="xs"
            size="full"
          />
          <Button
            title="Trigger HMIS Expiration"
            onPress={expireHmis}
            variant="primary"
            mb="xs"
            size="full"
          />
        </View>

        {result && (
          <View style={styles.resultCard}>
            <TextBold fontSize="sm" mb="xs">
              Result:
            </TextBold>
            <TextRegular
              fontSize="sm"
              color={Colors.NEUTRAL_DARK}
              style={styles.monospace}
            >
              {result}
            </TextRegular>
          </View>
        )}

        {sessionExpiry && (
          <View style={styles.infoCard}>
            <TextBold fontSize="sm" mb="xs">
              Session Expiry:
            </TextBold>
            <TextRegular fontSize="sm" color={Colors.NEUTRAL_DARK}>
              {new Date(sessionExpiry).toLocaleString()}
            </TextRegular>
          </View>
        )}

        {hmisExpiry && (
          <View style={styles.infoCard}>
            <TextBold fontSize="sm" mb="xs">
              HMIS Expiry:
            </TextBold>
            <TextRegular fontSize="sm" color={Colors.NEUTRAL_DARK}>
              {new Date(hmisExpiry).toLocaleString()}
            </TextRegular>
          </View>
        )}
      </ScrollView>
    </MainContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginBottom: Spacings.md,
  },
  resultCard: {
    backgroundColor: Colors.NEUTRAL_EXTRA_LIGHT,
    borderRadius: Radiuses.xs,
    padding: Spacings.sm,
    marginBottom: Spacings.md,
  },
  infoCard: {
    backgroundColor: Colors.BRAND_LIGHT,
    borderRadius: Radiuses.xs,
    padding: Spacings.sm,
    marginBottom: Spacings.sm,
  },
  monospace: {
    fontFamily: 'monospace',
  },
});
