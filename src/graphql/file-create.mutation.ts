export const FileCreateMutation = `
  mutation FileCreate($files: [FileCreateInput!]!) {
    fileCreate(files: $files) {
      files {
        id
        fileStatus
        fileErrors {
          code
          message
          details
        }
        ... on GenericFile {
          url
          mimeType
        }
      }
      userErrors {
        field
        message
        code
      }
    }
  }
`;
