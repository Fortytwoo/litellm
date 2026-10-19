import { t as translateUi } from "@/i18n";
import { getProviderLogoAndName, Providers, providerLogoMap } from "@/components/provider_info_helpers";
import milvusLogo from "../../public/assets/logos/milvus.svg";
import mongodbLogo from "../../public/assets/logos/mongodb.svg";
import postgresqlLogo from "../../public/assets/logos/postgresql.svg";
import s3VectorLogo from "../../public/assets/logos/s3_vector.png";
import valkeyLogo from "../../public/assets/logos/valkey.svg";

export enum VectorStoreProviders {
  Bedrock = "Amazon Bedrock",
  S3Vectors = "Amazon S3 Vectors",
  PgVector = "PostgreSQL pgvector (LiteLLM Connector)",
  VertexRagEngine = "Vertex AI RAG Engine",
  VertexAiSearch = "Vertex AI Search",
  OpenAI = "OpenAI",
  Azure = "Azure OpenAI",
  Milvus = "Milvus",
  MongoDB = "MongoDB (BETA)",
  Valkey = "Valkey",
}

export const vectorStoreProviderMap: Record<string, string> = {
  Bedrock: "bedrock",
  PgVector: "pg_vector",
  VertexRagEngine: "vertex_ai",
  VertexAiSearch: "vertex_ai/search_api",
  OpenAI: "openai",
  Azure: "azure",
  Milvus: "milvus",
  MongoDB: "mongodb",
  S3Vectors: "s3_vectors",
  Valkey: "valkey",
};

export const vectorStoreProviderLogoMap: Record<string, string> = {
  [VectorStoreProviders.Bedrock]: providerLogoMap[Providers.Bedrock] ?? "",
  [VectorStoreProviders.PgVector]: postgresqlLogo.src,
  [VectorStoreProviders.VertexRagEngine]: providerLogoMap[Providers.Vertex_AI] ?? "",
  [VectorStoreProviders.VertexAiSearch]: providerLogoMap[Providers.Vertex_AI] ?? "",
  [VectorStoreProviders.OpenAI]: providerLogoMap[Providers.OpenAI] ?? "",
  [VectorStoreProviders.Azure]: providerLogoMap[Providers.Azure] ?? "",
  [VectorStoreProviders.Milvus]: milvusLogo.src,
  [VectorStoreProviders.MongoDB]: mongodbLogo.src,
  [VectorStoreProviders.S3Vectors]: s3VectorLogo.src,
  [VectorStoreProviders.Valkey]: valkeyLogo.src,
};

// Define field types for provider-specific configurations
export interface VectorStoreFieldConfig {
  name: string;
  label: string;
  tooltip: string;
  placeholder?: string;
  required: boolean;
  type?: "text" | "password" | "select";
  options?: { value: string; label: string }[];
  initialValue?: string;
}

// Provider-specific field configurations
export const vectorStoreProviderFields: Record<string, VectorStoreFieldConfig[]> = {
  bedrock: [],
  pg_vector: [
    {
      name: "api_base",
      get label() {
        return translateUi("ui.0c9c3591f7c3");
      },
      get tooltip() {
        return translateUi("ui.7dd5045af7df405f");
      },
      placeholder: "http://your-deployed-server:8000",
      required: true,
      type: "text",
    },
    {
      name: "api_key",
      get label() {
        return translateUi("ui.23189d55f697");
      },
      get tooltip() {
        return translateUi("ui.54e884b188ff0357");
      },
      get placeholder() {
        return translateUi("ui.bdd5cbebb7c7fbd6");
      },
      required: true,
      type: "password",
    },
  ],
  vertex_rag_engine: [],
  "vertex_ai/search_api": [
    {
      name: "vertex_project",
      get label() {
        return translateUi("ui.1c89933f7f87b677");
      },
      get tooltip() {
        return translateUi("ui.08376660f07c2855");
      },
      get placeholder() {
        return translateUi("ui.4ce8239e66e9b1cd");
      },
      required: true,
      type: "text",
    },
    {
      name: "vertex_location",
      get label() {
        return translateUi("ui.0a20d3860ef556e9");
      },
      get tooltip() {
        return translateUi("ui.9924949018b26ddf");
      },
      required: true,
      type: "select",
      options: [
        {
          value: "global",
          get label() {
            return translateUi("ui.8001c27439650c5c");
          },
        },
        {
          value: "us",
          get label() {
            return translateUi("ui.79adb2a2fce5c6ba");
          },
        },
        {
          value: "eu",
          get label() {
            return translateUi("ui.4d0282941aaf2d69");
          },
        },
      ],
      initialValue: "global",
    },
    {
      name: "vertex_collection_id",
      get label() {
        return translateUi("ui.0f421c947cc40fd6");
      },
      get tooltip() {
        return translateUi("ui.f41156177e167f76");
      },
      get placeholder() {
        return translateUi("ui.db86db9dcfb6bb9d");
      },
      required: false,
      type: "text",
    },
    {
      name: "vertex_engine_id",
      get label() {
        return translateUi("ui.82e6fee50c8f0cf2");
      },
      get tooltip() {
        return translateUi("ui.497ffa2828fa5c82");
      },
      get placeholder() {
        return translateUi("ui.416432ee05e17f26");
      },
      required: false,
      type: "text",
    },
  ],
  openai: [
    {
      name: "api_key",
      get label() {
        return translateUi("ui.23189d55f697");
      },
      get tooltip() {
        return translateUi("ui.699e26dc48c9245c");
      },
      get placeholder() {
        return translateUi("ui.6946d3ffe03d648c");
      },
      required: true,
      type: "password",
    },
  ],
  azure: [
    {
      name: "api_key",
      get label() {
        return translateUi("ui.23189d55f697");
      },
      get tooltip() {
        return translateUi("ui.3e8205b3f3f8ef9e");
      },
      get placeholder() {
        return translateUi("ui.45010e418fcb9e4e");
      },
      required: true,
      type: "password",
    },
    {
      name: "api_base",
      get label() {
        return translateUi("ui.0c9c3591f7c3");
      },
      get tooltip() {
        return translateUi("ui.32edf88d31e5ece9");
      },
      placeholder: "https://your-resource.openai.azure.com/",
      required: true,
      type: "text",
    },
  ],
  milvus: [
    {
      name: "api_key",
      get label() {
        return translateUi("ui.23189d55f697");
      },
      get tooltip() {
        return translateUi("ui.ac869f5d8f911a37");
      },
      get placeholder() {
        return translateUi("ui.08d8d62a27313617");
      },
      required: true,
      type: "password",
    },
    {
      name: "api_base",
      get label() {
        return translateUi("ui.0c9c3591f7c3");
      },
      get tooltip() {
        return translateUi("ui.75057a71b636aeae");
      },
      placeholder: "https://your-milvus-endpoint.com/",
      required: true,
      type: "text",
    },
    {
      name: "embedding_model",
      get label() {
        return translateUi("ui.860ec100606ba01b");
      },
      get tooltip() {
        return translateUi("ui.4607522ce50837bf");
      },
      placeholder: "text-embedding-3-small",
      required: true,
      type: "select",
    },
  ],
  mongodb: [
    {
      name: "api_base",
      get label() {
        return translateUi("ui.65f21efd07cc8d0e");
      },
      get tooltip() {
        return translateUi("ui.c20d190407737a40");
      },
      placeholder: "http://127.0.0.1:8080",
      required: true,
      type: "text",
    },
    {
      name: "api_key",
      get label() {
        return translateUi("ui.59b2c3777d7c9062");
      },
      get tooltip() {
        return translateUi("ui.f9db54181b637159");
      },
      get placeholder() {
        return translateUi("ui.79a54de86633ca75");
      },
      required: true,
      type: "password",
    },
    {
      name: "mongodb_database",
      get label() {
        return translateUi("ui.fa7fe67124e94375");
      },
      get tooltip() {
        return translateUi("ui.40db5ffa0c033b2b");
      },
      placeholder: "sample_mflix",
      required: true,
      type: "text",
    },
    {
      name: "mongodb_collection",
      get label() {
        return translateUi("ui.7b790708ff1b1713");
      },
      get tooltip() {
        return translateUi("ui.25b81e52268fefee");
      },
      placeholder: "embedded_movies",
      required: true,
      type: "text",
    },
    {
      name: "embedding_model",
      get label() {
        return translateUi("ui.860ec100606ba01b");
      },
      get tooltip() {
        return translateUi("ui.7f11aa1b4fdcfb52");
      },
      placeholder: "text-embedding-3-small",
      required: true,
      type: "select",
    },
    {
      name: "mongodb_embedding_field",
      get label() {
        return translateUi("ui.80f43ccde464ef5d");
      },
      get tooltip() {
        return translateUi("ui.f98dfadac7f230c6");
      },
      get placeholder() {
        return translateUi("ui.aa580156f36e357b");
      },
      required: false,
      type: "text",
      initialValue: "embedding",
    },
    {
      name: "mongodb_text_field",
      get label() {
        return translateUi("ui.bae9f7252798def4");
      },
      get tooltip() {
        return translateUi("ui.1f52c07c161a58cb");
      },
      get placeholder() {
        return translateUi("ui.982d9e3eb996f559");
      },
      required: false,
      type: "text",
      initialValue: "text",
    },
    {
      name: "mongodb_num_candidates",
      get label() {
        return translateUi("ui.83a4f418359ec1c9");
      },
      get tooltip() {
        return translateUi("ui.e49be45e1ec8e415");
      },
      placeholder: "100",
      required: false,
      type: "text",
    },
  ],
  valkey: [
    {
      name: "valkey_host",
      get label() {
        return translateUi("ui.f447ab89ead9dc89");
      },
      get tooltip() {
        return translateUi("ui.7c269d6bb7df1805");
      },
      get placeholder() {
        return translateUi("ui.2b522826ae4ab3be");
      },
      required: true,
      type: "text",
    },
    {
      name: "valkey_port",
      get label() {
        return translateUi("ui.1286d8384228a7a7");
      },
      get tooltip() {
        return translateUi("ui.7403d07febac0b56");
      },
      placeholder: "6379",
      required: false,
      type: "text",
      initialValue: "6379",
    },
    {
      name: "valkey_password",
      get label() {
        return translateUi("ui.7ca8e1900c4bfa78");
      },
      get tooltip() {
        return translateUi("ui.4d9ec48dc9d736f0");
      },
      required: false,
      type: "password",
    },
    {
      name: "valkey_ssl",
      get label() {
        return translateUi("ui.377ccb2abdc512f1");
      },
      get tooltip() {
        return translateUi("ui.822374dcaefb4e46");
      },
      required: false,
      type: "select",
      options: [
        {
          value: "false",
          get label() {
            return translateUi("ui.fcbcf165908dd18a");
          },
        },
        {
          value: "true",
          get label() {
            return translateUi("ui.b5bea41b6c623f7c");
          },
        },
      ],
      initialValue: "false",
    },
    {
      name: "embedding_model",
      get label() {
        return translateUi("ui.860ec100606ba01b");
      },
      get tooltip() {
        return translateUi("ui.59be4e8495e4e286");
      },
      placeholder: "text-embedding-3-small",
      required: true,
      type: "select",
    },
    {
      name: "valkey_text_field",
      get label() {
        return translateUi("ui.bae9f7252798def4");
      },
      get tooltip() {
        return translateUi("ui.fb2ec0c961ba2544");
      },
      get placeholder() {
        return translateUi("ui.982d9e3eb996f559");
      },
      required: false,
      type: "text",
      initialValue: "text",
    },
    {
      name: "valkey_embedding_field",
      get label() {
        return translateUi("ui.80f43ccde464ef5d");
      },
      get tooltip() {
        return translateUi("ui.e6331e3db7504553");
      },
      get placeholder() {
        return translateUi("ui.aa580156f36e357b");
      },
      required: false,
      type: "text",
      initialValue: "embedding",
    },
  ],
  s3_vectors: [
    {
      name: "vector_bucket_name",
      get label() {
        return translateUi("ui.3e64d2096956da2f");
      },
      get tooltip() {
        return translateUi("ui.0a966d31dfdb408b");
      },
      get placeholder() {
        return translateUi("ui.75e080931d0d9a85");
      },
      required: true,
      type: "text",
    },
    {
      name: "index_name",
      get label() {
        return translateUi("ui.0f53d21d5f51a27b");
      },
      get tooltip() {
        return translateUi("ui.1f11b5b6db34ac10");
      },
      get placeholder() {
        return translateUi("ui.ba58237e4407af63");
      },
      required: false,
      type: "text",
    },
    {
      name: "aws_region_name",
      get label() {
        return translateUi("ui.7e489ee639b80be4");
      },
      get tooltip() {
        return translateUi("ui.8e15a2cdc5331162");
      },
      get placeholder() {
        return translateUi("ui.d8c0d0637775d579");
      },
      required: true,
      type: "text",
    },
    {
      name: "embedding_model",
      get label() {
        return translateUi("ui.860ec100606ba01b");
      },
      get tooltip() {
        return translateUi("ui.18fdf9dec65ff3f6");
      },
      placeholder: "text-embedding-3-small",
      required: true,
      type: "select",
    },
  ],
};

export const getVectorStoreProviderLogoAndName = (providerValue: string): { logo: string; displayName: string } => {
  const enumKey = Object.keys(vectorStoreProviderMap).find(
    (key) => vectorStoreProviderMap[key].toLowerCase() === providerValue.toLowerCase(),
  );
  if (!enumKey) {
    return getProviderLogoAndName(providerValue);
  }
  const displayName = VectorStoreProviders[enumKey as keyof typeof VectorStoreProviders];
  return { logo: vectorStoreProviderLogoMap[displayName], displayName };
};

export const getProviderSpecificFields = (providerValue: string): VectorStoreFieldConfig[] => {
  return vectorStoreProviderFields[providerValue] || [];
};
