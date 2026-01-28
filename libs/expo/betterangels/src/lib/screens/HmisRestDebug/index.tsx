import { HmisError, ReactNativeFile } from '@monorepo/expo/shared/clients';
import { Colors, Radiuses, Spacings } from '@monorepo/expo/shared/static';
import {
  BasicInput,
  Button,
  MediaPickerModal,
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

type Section =
  | 'currentUser'
  | 'fileUpload'
  | 'categories'
  | 'clientFiles'
  | 'deleteFile'
  | 'photoUpload';

export default function HmisRestDebug() {
  const {
    getCurrentUser,
    uploadClientFile,
    getFileCategories,
    getClientFiles,
    deleteClientFile,
    hmisClient,
  } = useHmisClient();
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

  // File Categories state
  const [categoriesStatus, setCategoriesStatus] = useState<FetchStatus>('idle');
  const [categoriesOutput, setCategoriesOutput] = useState('');
  const [categoriesError, setCategoriesError] = useState<string | null>(null);

  // Client Files state
  const [filesClientId, setFilesClientId] = useState('404');
  const [filesPage, setFilesPage] = useState('1');
  const [filesPerPage, setFilesPerPage] = useState('10');
  const [filesStatus, setFilesStatus] = useState<FetchStatus>('idle');
  const [filesOutput, setFilesOutput] = useState('');
  const [filesError, setFilesError] = useState<string | null>(null);

  // Delete File state
  const [deleteClientId, setDeleteClientId] = useState('404');
  const [deleteFileId, setDeleteFileId] = useState('37');
  const [deleteStatus, setDeleteStatus] = useState<FetchStatus>('idle');
  const [deleteOutput, setDeleteOutput] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Photo Upload state
  const [photoClientId, setPhotoClientId] = useState('403');
  const [photoStatus, setPhotoStatus] = useState<FetchStatus>('idle');
  const [photoOutput, setPhotoOutput] = useState('');
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [photoPickerVisible, setPhotoPickerVisible] = useState(false);

  // Photo Crop state
  const [cropClientId, setCropClientId] = useState('403');
  const [cropX1, setCropX1] = useState('0');
  const [cropY1, setCropY1] = useState('0');
  const [cropW, setCropW] = useState('100');
  const [cropH, setCropH] = useState('100');
  const [cropStatus, setCropStatus] = useState<FetchStatus>('idle');
  const [cropOutput, setCropOutput] = useState('');
  const [cropError, setCropError] = useState<string | null>(null);

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
      const testContent =
        'This is a test file uploaded from the HMIS REST debugger.\n\nTimestamp: ' +
        new Date().toISOString();
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
  }, [clientId, uploadClientFile, fileName, categoryId, fileNameId]);

  const clearUploadOutput = useCallback(() => {
    setUploadOutput('');
    setUploadError(null);
    setUploadStatus('idle');
  }, []);

  const handleFetchCategories = useCallback(async () => {
    setCategoriesStatus('loading');
    setCategoriesError(null);
    setCategoriesOutput('');

    try {
      const categories = await getFileCategories();
      setCategoriesOutput(JSON.stringify(categories, null, 2));
      setCategoriesStatus('success');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Request failed. See logs.';
      setCategoriesError(message);

      if (err instanceof HmisError && err.data) {
        setCategoriesOutput(JSON.stringify(err.data, null, 2));
      }

      setCategoriesStatus('error');
    }
  }, [getFileCategories]);

  const clearCategoriesOutput = useCallback(() => {
    setCategoriesOutput('');
    setCategoriesError(null);
    setCategoriesStatus('idle');
  }, []);

  const handleFetchClientFiles = useCallback(async () => {
    if (!filesClientId.trim()) {
      setFilesError('Client ID is required');
      return;
    }

    setFilesStatus('loading');
    setFilesError(null);
    setFilesOutput('');

    try {
      const result = await getClientFiles(filesClientId.trim(), {
        sort: '-file_date',
        expand: 'agency,file,category,fileName',
        is_file: 1,
        deleted: 0,
        page: parseInt(filesPage, 10),
        per_page: parseInt(filesPerPage, 10),
      });

      setFilesOutput(JSON.stringify(result, null, 2));
      setFilesStatus('success');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Request failed. See logs.';
      setFilesError(message);

      if (err instanceof HmisError && err.data) {
        setFilesOutput(JSON.stringify(err.data, null, 2));
      }

      setFilesStatus('error');
    }
  }, [filesClientId, filesPage, filesPerPage, getClientFiles]);

  const clearFilesOutput = useCallback(() => {
    setFilesOutput('');
    setFilesError(null);
    setFilesStatus('idle');
  }, []);

  const handleDeleteFile = useCallback(async () => {
    setDeleteStatus('loading');
    setDeleteError(null);
    setDeleteOutput('');

    try {
      await deleteClientFile(deleteClientId, deleteFileId);
      setDeleteOutput(
        JSON.stringify(
          {
            message: 'File deleted successfully',
            clientId: deleteClientId,
            fileId: deleteFileId,
          },
          null,
          2
        )
      );
      setDeleteStatus('success');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Request failed. See logs.';
      setDeleteError(message);

      if (err instanceof HmisError && err.data) {
        setDeleteOutput(JSON.stringify(err.data, null, 2));
      }

      setDeleteStatus('error');
    }
  }, [deleteClientFile, deleteClientId, deleteFileId]);

  const clearDeleteOutput = useCallback(() => {
    setDeleteOutput('');
    setDeleteError(null);
    setDeleteStatus('idle');
  }, []);

  const handlePhotoUpload = useCallback(async (file: ReactNativeFile) => {
    if (!photoClientId.trim()) {
      setPhotoError('Client ID is required');
      return;
    }

    setPhotoStatus('loading');
    setPhotoError(null);
    setPhotoOutput('');
    setPhotoPickerVisible(false);

    try {
      const clientId = photoClientId.trim();
      const endpoint = `/clients/${clientId}/photo/upload`;
      
      // Create FormData with the correct field name expected by the API
      const formData = new FormData();
      formData.append('FileForm[uploadedFile]', file as any);

      // POST /clients/:clientId/photo/upload
      // Expected: multipart/form-data with FileForm[uploadedFile] field containing actual file
      const result = await hmisClient.postMultipart(endpoint, formData);

      setPhotoOutput(JSON.stringify(result, null, 2));
      setPhotoStatus('success');
    } catch (err) {
      const message =
        err instanceof HmisError && err.data
          ? JSON.stringify(err.data, null, 2)
          : err instanceof Error
          ? err.message
          : 'Photo upload failed. See logs.';
      setPhotoError(err instanceof HmisError ? err.message : message);

      if (err instanceof HmisError && err.data) {
        setPhotoOutput(JSON.stringify(err.data, null, 2));
      }

      setPhotoStatus('error');
    }
  }, [photoClientId, hmisClient]);

  const clearPhotoOutput = useCallback(() => {
    setPhotoOutput('');
    setPhotoError(null);
    setPhotoStatus('idle');
  }, []);

  const handlePhotoCrop = useCallback(async () => {
    if (!cropClientId.trim()) {
      setCropError('Client ID is required');
      return;
    }

    setCropStatus('loading');
    setCropError(null);
    setCropOutput('');

    try {
      const clientId = cropClientId.trim();
      const endpoint = `/clients/${clientId}/photo/crop`;
      const payload = {
        PhotoList: {
          x1: parseInt(cropX1, 10),
          y1: parseInt(cropY1, 10),
          w: parseInt(cropW, 10),
          h: parseInt(cropH, 10),
        },
      };

      // POST /clients/:clientId/photo/crop
      // Expected request body: { PhotoList: { x1: number, y1: number, w: number, h: number } }
      const result = await hmisClient.post(endpoint, payload);

      setCropOutput(JSON.stringify(result, null, 2));
      setCropStatus('success');
    } catch (err) {
      const message =
        err instanceof HmisError && err.data
          ? JSON.stringify(err.data, null, 2)
          : err instanceof Error
          ? err.message
          : 'Photo crop failed. See logs.';
      setCropError(err instanceof HmisError ? err.message : message);

      if (err instanceof HmisError && err.data) {
        setCropOutput(JSON.stringify(err.data, null, 2));
      }

      setCropStatus('error');
    }
  }, [cropClientId, cropX1, cropY1, cropW, cropH, hmisClient]);

  const hasOutput = output.trim().length > 0;
  const hasUploadOutput = uploadOutput.trim().length > 0;
  const hasCategoriesOutput = categoriesOutput.trim().length > 0;
  const hasFilesOutput = filesOutput.trim().length > 0;
  const hasDeleteOutput = deleteOutput.trim().length > 0;
  const hasPhotoOutput = photoOutput.trim().length > 0;
  const hasCropOutput = cropOutput.trim().length > 0;

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

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <View style={styles.tabRow}>
            <TabButton
              label="Current User"
              isActive={activeSection === 'currentUser'}
              onPress={() => setActiveSection('currentUser')}
            />
            <TabButton
              label="Upload File"
              isActive={activeSection === 'fileUpload'}
              onPress={() => setActiveSection('fileUpload')}
            />
            <TabButton
              label="Categories"
              isActive={activeSection === 'categories'}
              onPress={() => setActiveSection('categories')}
            />
          </View>
          <View style={styles.tabRow}>
            <TabButton
              label="List Files"
              isActive={activeSection === 'clientFiles'}
              onPress={() => setActiveSection('clientFiles')}
            />
            <TabButton
              label="Delete File"
              isActive={activeSection === 'deleteFile'}
              onPress={() => setActiveSection('deleteFile')}
            />
          </View>
          <View style={styles.tabRow}>
            <TabButton
              label="Photo Upload & Crop"
              isActive={activeSection === 'photoUpload'}
              onPress={() => setActiveSection('photoUpload')}
            />
          </View>
        </View>

        {/* Current User Section */}
        {activeSection === 'currentUser' && (
          <>
            <View style={styles.card}>
              <TextMedium>Request</TextMedium>
              <TextRegular size="sm" color={Colors.NEUTRAL_DARK}>
                Fetches /current-user with optional field selection.
                Credentials, User-Agent, and X-Requested-With headers are
                applied automatically by the client.
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
                title={
                  status === 'loading' ? 'Requesting…' : 'Fetch current user'
                }
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
                useHmisClient; otherwise enter a comma-separated list (parsed
                into an array).
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
                title={
                  uploadStatus === 'loading' ? 'Uploading…' : 'Upload test file'
                }
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
                disabled={
                  uploadStatus === 'loading' && !hasUploadOutput && !uploadError
                }
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

        {/* File Categories Section */}
        {activeSection === 'categories' && (
          <>
            <View style={styles.card}>
              <TextMedium>Fetch File Categories</TextMedium>
              <TextRegular size="sm" color={Colors.NEUTRAL_DARK}>
                Fetches the list of available file categories for client file
                uploads. These IDs can be used as the categoryId parameter when
                uploading files.
              </TextRegular>

              <Button
                title={
                  categoriesStatus === 'loading'
                    ? 'Fetching…'
                    : 'Fetch file categories'
                }
                variant="primary"
                onPress={handleFetchCategories}
                loading={categoriesStatus === 'loading'}
                accessibilityHint="Fetches the list of available file categories"
                size="full"
              />

              <Button
                title="Clear output"
                variant="secondary"
                onPress={clearCategoriesOutput}
                accessibilityHint="Reset the displayed response and status"
                size="full"
                mt="xs"
                disabled={
                  categoriesStatus === 'loading' &&
                  !hasCategoriesOutput &&
                  !categoriesError
                }
              />

              <TextRegular size="xs" color={Colors.NEUTRAL_DARK}>
                Shows all available file categories returned from the
                /client-file-categories endpoint.
              </TextRegular>
            </View>

            <View style={styles.card}>
              <View style={styles.statusRow}>
                <TextMedium>Status</TextMedium>
                <TextRegular color={STATUS_COLOR[categoriesStatus]}>
                  {STATUS_LABEL[categoriesStatus]}
                </TextRegular>
              </View>

              {categoriesError && (
                <TextRegular color={Colors.ERROR_DARK} size="sm">
                  {categoriesError}
                </TextRegular>
              )}

              <View style={styles.output}>
                <TextRegular
                  selectable
                  size="xs"
                  color={Colors.PRIMARY_EXTRA_DARK}
                  style={styles.code}
                >
                  {hasCategoriesOutput
                    ? categoriesOutput
                    : 'No response yet. Run the request to see JSON or text output.'}
                </TextRegular>
              </View>
            </View>
          </>
        )}

        {/* Client Files Section */}
        {activeSection === 'clientFiles' && (
          <>
            <View style={styles.card}>
              <TextMedium>List Client Files</TextMedium>
              <TextRegular size="sm" color={Colors.NEUTRAL_DARK}>
                Fetches the paginated list of files for a specific client with
                sorting, filtering, and field expansion support.
              </TextRegular>

              <BasicInput
                label="Client ID *"
                placeholder="404"
                value={filesClientId}
                onChangeText={setFilesClientId}
                autoCapitalize="none"
                autoCorrect={false}
                mb="xs"
              />

              <View style={styles.row}>
                <View style={styles.halfInput}>
                  <BasicInput
                    label="Page"
                    placeholder="1"
                    value={filesPage}
                    onChangeText={setFilesPage}
                    keyboardType="numeric"
                    mb="xs"
                  />
                </View>
                <View style={styles.halfInput}>
                  <BasicInput
                    label="Per Page"
                    placeholder="10"
                    value={filesPerPage}
                    onChangeText={setFilesPerPage}
                    keyboardType="numeric"
                    mb="xs"
                  />
                </View>
              </View>

              <Button
                title={
                  filesStatus === 'loading' ? 'Fetching…' : 'Fetch client files'
                }
                variant="primary"
                onPress={handleFetchClientFiles}
                loading={filesStatus === 'loading'}
                accessibilityHint="Fetches the list of files for the specified client"
                size="full"
              />

              <Button
                title="Clear output"
                variant="secondary"
                onPress={clearFilesOutput}
                accessibilityHint="Reset the displayed response and status"
                size="full"
                mt="xs"
                disabled={
                  filesStatus === 'loading' && !hasFilesOutput && !filesError
                }
              />

              <TextRegular size="xs" color={Colors.NEUTRAL_DARK}>
                Lists files with sorting by date, expanded relations (agency,
                file, category, fileName), and pagination.
              </TextRegular>
            </View>

            <View style={styles.card}>
              <View style={styles.statusRow}>
                <TextMedium>Status</TextMedium>
                <TextRegular color={STATUS_COLOR[filesStatus]}>
                  {STATUS_LABEL[filesStatus]}
                </TextRegular>
              </View>

              {filesError && (
                <TextRegular color={Colors.ERROR_DARK} size="sm">
                  {filesError}
                </TextRegular>
              )}

              <View style={styles.output}>
                <TextRegular
                  selectable
                  size="xs"
                  color={Colors.PRIMARY_EXTRA_DARK}
                  style={styles.code}
                >
                  {hasFilesOutput
                    ? filesOutput
                    : 'No response yet. Run the request to see JSON or text output.'}
                </TextRegular>
              </View>
            </View>
          </>
        )}

        {/* Delete File Section */}
        {activeSection === 'deleteFile' && (
          <>
            <View style={styles.card}>
              <TextMedium>Request</TextMedium>
              <TextRegular size="sm" color={Colors.NEUTRAL_DARK}>
                Permanently deletes a file from a client's file list.
              </TextRegular>

              <View style={styles.row}>
                <View style={styles.halfInput}>
                  <BasicInput
                    label="Client ID"
                    placeholder="404"
                    value={deleteClientId}
                    onChangeText={setDeleteClientId}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
                <View style={styles.halfInput}>
                  <BasicInput
                    label="File ID"
                    placeholder="37"
                    value={deleteFileId}
                    onChangeText={setDeleteFileId}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

              <Button
                title={deleteStatus === 'loading' ? 'Deleting…' : 'Delete file'}
                variant="primary"
                onPress={handleDeleteFile}
                loading={deleteStatus === 'loading'}
                accessibilityHint="Calls HMIS DELETE endpoint to remove the file"
                size="full"
              />

              <Button
                title="Clear output"
                variant="secondary"
                onPress={clearDeleteOutput}
                accessibilityHint="Reset the displayed response and status"
                size="full"
                mt="xs"
                disabled={
                  deleteStatus === 'loading' && !hasDeleteOutput && !deleteError
                }
              />

              <TextRegular size="xs" color={Colors.NEUTRAL_DARK}>
                Sends DELETE request to /clients/
                {deleteClientId || '{clientId}'}/client-files/
                {deleteFileId || '{fileId}'}
              </TextRegular>
            </View>

            <View style={styles.card}>
              <View style={styles.statusRow}>
                <TextMedium>Status</TextMedium>
                <TextRegular color={STATUS_COLOR[deleteStatus]}>
                  {STATUS_LABEL[deleteStatus]}
                </TextRegular>
              </View>

              {deleteError && (
                <TextRegular color={Colors.ERROR_DARK} size="sm">
                  {deleteError}
                </TextRegular>
              )}

              <View style={styles.output}>
                <TextRegular
                  selectable
                  size="xs"
                  color={Colors.PRIMARY_EXTRA_DARK}
                  style={styles.code}
                >
                  {hasDeleteOutput
                    ? deleteOutput
                    : 'No response yet. Run the request to see JSON or text output.'}
                </TextRegular>
              </View>
            </View>
          </>
        )}

        {/* Photo Upload & Crop Section */}
        {activeSection === 'photoUpload' && (
          <>
            <View style={styles.card}>
              <TextMedium>Upload Client Photo</TextMedium>
              <TextRegular size="sm" color={Colors.NEUTRAL_DARK}>
                Select a photo from your device to test photo upload. Uses
                MediaPickerModal to get an actual file URI from camera/gallery.
              </TextRegular>
              <TextRegular size="sm" color={Colors.NEUTRAL_DARK} mt="xs">
                Endpoint: POST /clients/:clientId/photo/upload with multipart
                form field 'FileForm[uploadedFile]'
              </TextRegular>

              <BasicInput
                label="Client ID *"
                placeholder="403"
                value={photoClientId}
                onChangeText={setPhotoClientId}
                autoCapitalize="none"
                autoCorrect={false}
                mb="xs"
              />

              <Button
                title="Select Photo & Upload"
                variant="primary"
                onPress={() => setPhotoPickerVisible(true)}
                loading={photoStatus === 'loading'}
                disabled={photoStatus === 'loading'}
                accessibilityHint="Open photo picker to select and upload a photo"
                size="full"
              />

              <Button
                title="Clear output"
                variant="secondary"
                onPress={clearPhotoOutput}
                accessibilityHint="Reset the displayed response and status"
                size="full"
                mt="xs"
                disabled={
                  photoStatus === 'loading' && !hasPhotoOutput && !photoError
                }
              />

              <TextRegular size="xs" color={Colors.NEUTRAL_DARK}>
                Uploads a 1x1 test PNG image. In production, replace with actual
                image selection and encoding logic.
              </TextRegular>
            </View>

            <View style={styles.card}>
              <View style={styles.statusRow}>
                <TextMedium>Upload Status</TextMedium>
                <TextRegular color={STATUS_COLOR[photoStatus]}>
                  {STATUS_LABEL[photoStatus]}
                </TextRegular>
              </View>

              {photoError && (
                <TextRegular color={Colors.ERROR_DARK} size="sm">
                  {photoError}
                </TextRegular>
              )}

              <View style={styles.output}>
                <TextRegular
                  selectable
                  size="xs"
                  color={Colors.PRIMARY_EXTRA_DARK}
                  style={styles.code}
                >
                  {hasPhotoOutput
                    ? photoOutput
                    : 'No response yet. Run the upload to see JSON or text output.'}
                </TextRegular>
              </View>
            </View>

            <View style={styles.card}>
              <TextMedium>Crop Uploaded Photo</TextMedium>
              <TextRegular size="sm" color={Colors.NEUTRAL_DARK}>
                Crops an already-uploaded client photo using pixel coordinates.
                Uses the /clients/:clientId/photo/crop endpoint with PhotoList
                wrapper: {`{ PhotoList: { x1, y1, w, h } }`}
              </TextRegular>

              <BasicInput
                label="Client ID *"
                placeholder="403"
                value={cropClientId}
                onChangeText={setCropClientId}
                autoCapitalize="none"
                autoCorrect={false}
                mb="xs"
              />

              <View style={styles.row}>
                <View style={styles.halfInput}>
                  <BasicInput
                    label="X1 (top-left x)"
                    placeholder="0"
                    value={cropX1}
                    onChangeText={setCropX1}
                    keyboardType="numeric"
                    mb="xs"
                  />
                </View>
                <View style={styles.halfInput}>
                  <BasicInput
                    label="Y1 (top-left y)"
                    placeholder="0"
                    value={cropY1}
                    onChangeText={setCropY1}
                    keyboardType="numeric"
                    mb="xs"
                  />
                </View>
              </View>

              <View style={styles.row}>
                <View style={styles.halfInput}>
                  <BasicInput
                    label="Width"
                    placeholder="100"
                    value={cropW}
                    onChangeText={setCropW}
                    keyboardType="numeric"
                    mb="xs"
                  />
                </View>
                <View style={styles.halfInput}>
                  <BasicInput
                    label="Height"
                    placeholder="100"
                    value={cropH}
                    onChangeText={setCropH}
                    keyboardType="numeric"
                    mb="xs"
                  />
                </View>
              </View>

              <Button
                title={cropStatus === 'loading' ? 'Cropping…' : 'Crop photo'}
                variant="primary"
                onPress={handlePhotoCrop}
                loading={cropStatus === 'loading'}
                accessibilityHint="Crops the photo with specified coordinates"
                size="full"
              />

              <Button
                title="Clear output"
                variant="secondary"
                onPress={() => {
                  setCropOutput('');
                  setCropError(null);
                  setCropStatus('idle');
                }}
                accessibilityHint="Reset the displayed response and status"
                size="full"
                mt="xs"
                disabled={
                  cropStatus === 'loading' && !hasCropOutput && !cropError
                }
              />

              <TextRegular size="xs" color={Colors.NEUTRAL_DARK}>
                Requires an uploaded photo. Coordinates are in pixels relative
                to the original image.
              </TextRegular>
            </View>

            <View style={styles.card}>
              <View style={styles.statusRow}>
                <TextMedium>Crop Status</TextMedium>
                <TextRegular color={STATUS_COLOR[cropStatus]}>
                  {STATUS_LABEL[cropStatus]}
                </TextRegular>
              </View>

              {cropError && (
                <TextRegular color={Colors.ERROR_DARK} size="sm">
                  {cropError}
                </TextRegular>
              )}

              <View style={styles.output}>
                <TextRegular
                  selectable
                  size="xs"
                  color={Colors.PRIMARY_EXTRA_DARK}
                  style={styles.code}
                >
                  {hasCropOutput
                    ? cropOutput
                    : 'No response yet. Run the crop to see JSON or text output.'}
                </TextRegular>
              </View>
            </View>
          </>
        )}
      </View>
      <MediaPickerModal
        onCapture={handlePhotoUpload}
        setModalVisible={setPhotoPickerVisible}
        isModalVisible={photoPickerVisible}
        setFiles={(files) => handlePhotoUpload(files[0])}
        allowMultiple={false}
      />
    </MainScrollContainer>
  );
}

/**
 * Reusable tab button component
 */
function TabButton({
  label,
  isActive,
  onPress,
}: {
  label: string;
  isActive: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.tabButton, isActive && styles.tabButtonActive]}
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityLabel={`${label} Tab`}
      accessibilityHint={`Switch to the ${label} section`}
      accessibilityState={{ selected: isActive }}
    >
      <TextMedium
        size="sm"
        color={isActive ? Colors.PRIMARY_EXTRA_DARK : Colors.NEUTRAL_DARK}
      >
        {label}
      </TextMedium>
    </TouchableOpacity>
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
  tabContainer: {
    gap: Spacings.xs,
  },
  tabRow: {
    flexDirection: 'row',
    gap: Spacings.xs,
  },
  tabButton: {
    flex: 1,
    paddingVertical: Spacings.sm,
    paddingHorizontal: Spacings.xs,
    alignItems: 'center',
    backgroundColor: Colors.WHITE,
    borderWidth: 1,
    borderColor: Colors.NEUTRAL_LIGHT,
    borderRadius: Radiuses.xs,
  },
  tabButtonActive: {
    backgroundColor: Colors.PRIMARY_EXTRA_LIGHT,
    borderColor: Colors.PRIMARY,
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
