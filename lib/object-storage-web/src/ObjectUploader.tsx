import { useEffect, useRef, useState, type ReactNode } from 'react';
import DashboardModal from '@uppy/react/dashboard-modal';
import Uppy, { type UploadResult, type UppyFile } from '@uppy/core';

import '@uppy/core/css/style.min.css';
import '@uppy/dashboard/css/style.min.css';

import AwsS3 from '@uppy/aws-s3';

interface GetUploadParametersResult {
  method: 'PUT';
  url: string;
  headers?: Record<string, string>;
  /** objectPath returned by the presign endpoint — stored in file meta so it is
   * accessible in onComplete as file.meta.objectPath */
  objectPath?: string;
}

interface ObjectUploaderProps {
  maxNumberOfFiles?: number;
  maxFileSize?: number;
  /**
   * Function to get upload parameters for each file.
   * IMPORTANT: This receives the file object - use file.name, file.size, file.type
   * to request per-file presigned URLs from your backend.
   *
   * If the presign response includes an `objectPath`, return it here so the component
   * can attach it to Uppy file metadata and make it available in onComplete via
   * `file.meta.objectPath`.
   */
  onGetUploadParameters: (
    file: UppyFile<Record<string, unknown>, Record<string, unknown>>,
  ) => Promise<GetUploadParametersResult>;
  /**
   * Called when one or more uploads complete. Each file in `result.successful` has
   * `file.meta.objectPath` set to the server-issued path for that upload.
   */
  onComplete?: (
    result: UploadResult<Record<string, unknown>, Record<string, unknown>>,
  ) => void;
  buttonClassName?: string;
  children: ReactNode;
}

/**
 * A file upload component that renders as a button and provides a modal interface for
 * file management.
 *
 * Uses Uppy v5 with the AwsS3 adapter (single-part PUT). The presign endpoint's
 * `objectPath` is attached to each Uppy file's metadata during `getUploadParameters`
 * and is accessible as `file.meta.objectPath` in the `onComplete` callback.
 */
export function ObjectUploader({
  maxNumberOfFiles = 1,
  maxFileSize = 10485760, // 10MB default
  onGetUploadParameters,
  onComplete,
  buttonClassName,
  children,
}: ObjectUploaderProps) {
  const onCompleteRef = useRef(onComplete);
  const onGetUploadParametersRef = useRef(onGetUploadParameters);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);
  useEffect(() => {
    onGetUploadParametersRef.current = onGetUploadParameters;
  }, [onGetUploadParameters]);

  const [showModal, setShowModal] = useState(false);
  const [uppy] = useState(() =>
    new Uppy({
      restrictions: {
        maxNumberOfFiles,
        maxFileSize,
      },
      autoProceed: false,
    })
      .use(AwsS3, {
        shouldUseMultipart: false,
        getUploadParameters: async (file) => {
          const result = await onGetUploadParametersRef.current(file);
          // Store objectPath in file meta so it survives through the upload
          // and is accessible in onComplete (S3 PUT response body is typically empty).
          if (result.objectPath) {
            // uppy is captured in closure from useState initializer
            uppyRef.current?.setFileMeta(file.id, { objectPath: result.objectPath });
          }
          return { method: result.method, url: result.url, headers: result.headers };
        },
      })
      .on('complete', (result) => {
        onCompleteRef.current?.(result);
      }),
  );

  // Hold a ref to uppy so the getUploadParameters closure can call setFileMeta.
  const uppyRef = useRef<typeof uppy>(uppy);

  return (
    <div>
      <button onClick={() => setShowModal(true)} className={buttonClassName}>
        {children}
      </button>

      <DashboardModal
        uppy={uppy}
        open={showModal}
        onRequestClose={() => setShowModal(false)}
        proudlyDisplayPoweredByUppy={false}
      />
    </div>
  );
}
