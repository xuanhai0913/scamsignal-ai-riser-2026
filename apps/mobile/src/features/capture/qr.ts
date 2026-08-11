export type BarcodeCandidate = {
  type: string;
  data: string;
};

export function firstQrData(results: readonly BarcodeCandidate[]): string | undefined {
  const result = results.find(
    (candidate) => candidate.type.toLowerCase() === 'qr' && candidate.data.trim().length > 0,
  );

  return result?.data.trim();
}
