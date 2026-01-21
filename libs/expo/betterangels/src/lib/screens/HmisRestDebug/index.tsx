import { HmisError } from '@monorepo/expo/shared/clients';
import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import {
  BasicInput,
  Button,
  TextMedium,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useHmisClient } from '../../hooks';
import { MainScrollContainer } from '../../ui-components';

type FetchStatus = 'idle' | 'loading' | 'success' | 'error';

const STATUS_LABEL: Record<FetchStatus, string> = {
  idle: 'Not requested yet',
  loading: 'Loading…',
  success: 'Success',
  error: 'Error',
};

const STATUS_COLOR: Record<FetchStatus, string> = {
  idle: Colors.NEUTRAL_DARK,
  loading: Colors.PRIMARY_DARK,
  success: Colors.SUCCESS_DARK,
  error: Colors.ERROR_DARK,
};

export default function HmisRestDebug() {
  const { getCurrentUser } = useHmisClient();
  const [fields, setFields] = useState('');
  const [status, setStatus] = useState<FetchStatus>('idle');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleFetch = useCallback(async () => {
    const selectedFields = fields.trim()
      ? fields
          .split(',')
          .map((f) => f.trim())
          .filter(Boolean)
      : undefined;
    setStatus('loading');
    setError(null);
    setOutput('');

    try {
      const data = await getCurrentUser(selectedFields);
      setOutput(JSON.stringify(data, null, 2));
      setStatus('success');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Request failed. See logs.';
      setError(message);

      if (err instanceof HmisError && err.data) {
        setOutput(JSON.stringify(err.data, null, 2));
      }

      setStatus('error');
    }
  }, [fields, getCurrentUser]);

  const clearOutput = useCallback(() => {
    setOutput('');
    setError(null);
    setStatus('idle');
  }, []);

  const hasOutput = output.trim().length > 0;

  if (!__DEV__) {
    return (
      <MainScrollContainer bg={Colors.NEUTRAL_EXTRA_LIGHT}>
        <View style={styles.content}>
          <View style={styles.banner}>
            <TextMedium>HMIS REST tester</TextMedium>
            <TextRegular size="sm" color={Colors.NEUTRAL_DARK}>
              This screen is available only in development builds.
            </TextRegular>
          </View>
        </View>
      </MainScrollContainer>
    );
  }

  return (
    <MainScrollContainer bg={Colors.NEUTRAL_EXTRA_LIGHT} keyboardAware>
      <View style={styles.content}>
        <View style={styles.banner}>
          <TextMedium>HMIS REST tester (dev)</TextMedium>
          <TextRegular size="sm" color={Colors.PRIMARY_EXTRA_DARK}>
            Calls the HMIS REST API directly using stored auth_token/api_url
            cookies. Useful for verifying /current-user or other HMIS-only
            endpoints without touching the backend proxy.
          </TextRegular>
          <TextRegular size="sm" color={Colors.NEUTRAL_DARK}>
            Leave fields empty to use the default field set provided in
            useHmisClient; otherwise pass a comma-separated list.
          </TextRegular>
        </View>

        <View style={styles.card}>
          <TextMedium>Request</TextMedium>
          <TextRegular size="sm" color={Colors.NEUTRAL_DARK}>
            Fetches /current-user with optional field selection. Credentials,
            User-Agent, and X-Requested-With headers are applied automatically
            by the client.
          </TextRegular>

          <BasicInput
            label="Fields (optional)"
            placeholder="id,first_name,last_name"
            value={fields}
            onChangeText={setFields}
            autoCapitalize="none"
            autoCorrect={false}
            mb="xs"
          />

          <Button
            title={status === 'loading' ? 'Requesting…' : 'Fetch current user'}
            variant="primary"
            onPress={handleFetch}
            loading={status === 'loading'}
            accessibilityHint="Calls HMIS /current-user with optional fields"
            size="full"
          />

          <Button
            title="Clear output"
            variant="secondary"
            onPress={clearOutput}
            accessibilityHint="Reset the displayed response and status"
            size="full"
            mt="xs"
            disabled={status === 'loading' && !hasOutput && !error}
          />

          <TextRegular size="xs" color={Colors.NEUTRAL_DARK}>
            Output shows the parsed JSON response or error payload (if any).
          </TextRegular>
        </View>

        <View style={styles.card}>
          <View style={styles.statusRow}>
            <TextMedium>Status</TextMedium>
            <TextRegular color={STATUS_COLOR[status]}>
              {STATUS_LABEL[status]}
            </TextRegular>
          </View>

          {error && (
            <TextRegular color={Colors.ERROR_DARK} size="sm">
              {error}
            </TextRegular>
          )}

          <View style={styles.output}>
            <TextRegular
              selectable
              size="xs"
              color={Colors.PRIMARY_EXTRA_DARK}
              style={styles.code}
            >
              {hasOutput
                ? output
                : 'No response yet. Run the request to see JSON or text output.'}
            </TextRegular>
          </View>
        </View>
      </View>
    </MainScrollContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    gap: Spacings.sm,
  },
  banner: {
    backgroundColor: Colors.WARNING_EXTRA_LIGHT,
    borderColor: Colors.WARNING_LIGHT,
    borderWidth: 1,
    borderRadius: Radiuses.xs,
    padding: Spacings.sm,
    gap: Spacings.xs,
  },
  card: {
    backgroundColor: Colors.WHITE,
    borderRadius: Radiuses.xs,
    padding: Spacings.sm,
    borderWidth: 1,
    borderColor: Colors.NEUTRAL_LIGHT,
    gap: Spacings.xs,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  output: {
    backgroundColor: Colors.NEUTRAL_EXTRA_LIGHT,
    borderColor: Colors.NEUTRAL_LIGHT,
    borderWidth: 1,
    borderRadius: Radiuses.xs,
    padding: Spacings.sm,
    minHeight: 200,
  },
  code: {
    lineHeight: 18,
  },
});
