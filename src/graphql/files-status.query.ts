export const FilesStatusQuery = `
  query FilesStatus($ids: [ID!]!) {
    nodes(ids: $ids) {
      ... on File {
        id
        fileStatus
        fileErrors {
          code
          message
          details
        }
      }
      ... on GenericFile {
        url
        mimeType
      }
    }
  }
`;
