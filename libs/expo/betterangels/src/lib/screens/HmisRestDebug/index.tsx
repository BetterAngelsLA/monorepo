import { HmisError } from '@monorepo/expo/shared/clients';
import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import {
  BasicInput,
  Button,
  TextMedium,
  TextRegular,
} from '@monorepo/expo/shared/ui-components';
import { useCallback, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
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

type Section = 'currentUser' | 'fileUpload';

export default function HmisRestDebug() {
  const { getCurrentUser, uploadClientFile } = useHmisClient();
  const [activeSection, setActiveSection] = useState<Section>('currentUser');
  
  // Current User state
  const [fields, setFields] = useState('');
  const [status, setStatus] = useState<FetchStatus>('idle');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  // File Upload state
  const [clientId, setClientId] = useState('');
  const [fileName, setFileName] = useState('test-document.txt');
  const [categoryId, setCategoryId] = useState('12');
  const [fileNameId, setFileNameId] = useState('89');
  const [uploadStatus, setUploadStatus] = useState<FetchStatus>('idle');
  const [uploadOutput, setUploadOutput] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);

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
  
  const handleFileUpload = useCallback(async () => {
    if (!clientId.trim()) {
      setUploadError('Client ID is required');
      return;
    }
    
    setUploadStatus('loading');
    setUploadError(null);
    setUploadOutput('');

    try {
      // Create a test file with base64 content
      const testContent = 'This is a test file uploaded from the HMIS REST debugger.\n\nTimestamp: ' + new Date().toISOString();
      // Use btoa for base64 encoding (available in React Native)
      const base64Content = btoa(testContent);
      
      const result = await uploadClientFile(
        clientId.trim(),
        {
          content: base64Content,
          name: fileName.trim() || 'test-document.txt',
          mimeType: 'text/plain',
        },
        parseInt(categoryId, 10),
        parseInt(fileNameId, 10),
        false
      );
      
      setUploadOutput(JSON.stringify(result, null, 2));
      setUploadStatus('success');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Upload failed. See logs.';
      setUploadError(message);

      if (err instanceof HmisError && err.data) {
        setUploadOutput(JSON.stringify(err.data, null, 2));
      }

      setUploadStatus('error');
    }
  }, [clientId, fileName, categoryId, fileNameId, uploadClientFile]);
  
  const clearUploadOutput = useCallback(() => {
    setUploadOutput('');
    setUploadError(null);
    setUploadStatus('idle');
  }, []);

  const hasOutput = output.trim().length > 0;
  const hasUploadOutput = uploadOutput.trim().length > 0;

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
        </View>

        {/* Section Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[
              styles.tab,
              activeSection === 'currentUser' && styles.tabActive,
            ]}
            onPress={() => setActiveSection('currentUser')}
            accessibilityRole="tab"
            accessibilityLabel="Current User Tab"
            accessibilityHint="Switch to the Current User API test section"
            accessibilityState={{ selected: activeSection === 'currentUser' }}
          >
            <TextMedium
              size="sm"
              color={
                activeSection === 'currentUser'
                  ? Colors.PRIMARY_EXTRA_DARK
                  : Colors.NEUTRAL_DARK
              }
            >
              Current User
            </TextMedium>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab,
              activeSection === 'fileUpload' && styles.tabActive,
            ]}
            onPress={() => setActiveSection('fileUpload')}
            accessibilityRole="tab"
            accessibilityLabel="File Upload Tab"
            accessibilityHint="Switch to the File Upload API test section"
            accessibilityState={{ selected: activeSection === 'fileUpload' }}
          >
            <TextMedium
              size="sm"
              color={
                activeSection === 'fileUpload'
                  ? Colors.PRIMARY_EXTRA_DARK
                  : Colors.NEUTRAL_DARK
              }
            >
              File Upload
            </TextMedium>
          </TouchableOpacity>
        </View>

        {/* Current User Section */}
        {activeSection === 'currentUser' && (
          <>
            <View style={styles.card}>
              <TextMedium>Request</TextMedium>
              <TextRegular size="sm" color={Colors.NEUTRAL_DARK}>
                Fetches /current-user with optional field selection. Credentials,
                User-Agent, and X-Requested-With headers are applied automatically
                by the client.
              </TextRegular>

              <BasicInput
                label="Fields (optional)"
                placeholder="id, first_name, last_name"
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
                Leave fields empty to use the default field set provided in
                useHmisClient; otherwise enter a comma-separated list (parsed into
                an array).
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
          </>
        )}

        {/* File Upload Section */}
        {activeSection === 'fileUpload' && (
          <>
            <View style={styles.card}>
              <TextMedium>Upload Test File</TextMedium>
              <TextRegular size="sm" color={Colors.NEUTRAL_DARK}>
                Uploads a test text file to a client's file collection. Uses the
                uploadClientFile method with base64-encoded content.
              </TextRegular>

              <BasicInput
                label="Client ID *"
                placeholder="68998C256"
                value={clientId}
                onChangeText={setClientId}
                autoCapitalize="none"
                autoCorrect={false}
                mb="xs"
              />

              <BasicInput
                label="File Name"
                placeholder="test-document.txt"
                value={fileName}
                onChangeText={setFileName}
                autoCapitalize="none"
                autoCorrect={false}
                mb="xs"
              />

              <View style={styles.row}>
                <View style={styles.halfInput}>
                  <BasicInput
                    label="Category ID"
                    placeholder="12"
                    value={categoryId}
                    onChangeText={setCategoryId}
                    keyboardType="numeric"
                    mb="xs"
                  />
                </View>
                <View style={styles.halfInput}>
                  <BasicInput
                    label="File Name ID"
                    placeholder="89"
                    value={fileNameId}
                    onChangeText={setFileNameId}
                    keyboardType="numeric"
                    mb="xs"
                  />
                </View>
              </View>

              <Button
                title={uploadStatus === 'loading' ? 'Uploading…' : 'Upload test file'}
                variant="primary"
                onPress={handleFileUpload}
                loading={uploadStatus === 'loading'}
                accessibilityHint="Uploads a test text file to the specified client"
                size="full"
              />

              <Button
                title="Clear output"
                variant="secondary"
                onPress={clearUploadOutput}
                accessibilityHint="Reset the displayed response and status"
                size="full"
                mt="xs"
                disabled={uploadStatus === 'loading' && !hasUploadOutput && !uploadError}
              />

              <TextRegular size="xs" color={Colors.NEUTRAL_DARK}>
                Creates a timestamped text/plain file. File type validation and
                proper API structure (nested clientFile object) are handled
                automatically.
              </TextRegular>
            </View>

            <View style={styles.card}>
              <View style={styles.statusRow}>
                <TextMedium>Status</TextMedium>
                <TextRegular color={STATUS_COLOR[uploadStatus]}>
                  {STATUS_LABEL[uploadStatus]}
                </TextRegular>
              </View>

              {uploadError && (
                <TextRegular color={Colors.ERROR_DARK} size="sm">
                  {uploadError}
                </TextRegular>
              )}

              <View style={styles.output}>
                <TextRegular
                  selectable
                  size="xs"
                  color={Colors.PRIMARY_EXTRA_DARK}
                  style={styles.code}
                >
                  {hasUploadOutput
                    ? uploadOutput
                    : 'No response yet. Run the upload to see JSON or text output.'}
                </TextRegular>
              </View>
            </View>
          </>
        )}
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
  tabs: {
    flexDirection: 'row',
    backgroundColor: Colors.WHITE,
    borderRadius: Radiuses.xs,
    borderWidth: 1,
    borderColor: Colors.NEUTRAL_LIGHT,
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    padding: Spacings.sm,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: Colors.PRIMARY,
    backgroundColor: Colors.PRIMARY_EXTRA_LIGHT,
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
  row: {
    flexDirection: 'row',
    gap: Spacings.xs,
  },
  halfInput: {
    flex: 1,
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
