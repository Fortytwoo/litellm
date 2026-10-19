"use client";
import { useLanguage as useDashboardLanguage } from "@/contexts/LanguageContext";
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { VectorStoreTester } from "./VectorStoreTester";
import { VectorStore } from "@/components/vector_store_management/types";

interface TestVectorStoreTabProps {
  accessToken: string | null;
  vectorStores: VectorStore[];
}

const storeLabel = (store: VectorStore) => store.vector_store_name || store.vector_store_id;

const TestVectorStoreTab: React.FC<TestVectorStoreTabProps> = ({ accessToken, vectorStores }) => {
  const { t: uiT } = useDashboardLanguage();

  const [selectedVectorStore, setSelectedVectorStore] = useState<VectorStore | null>(vectorStores[0] ?? null);

  if (!accessToken) {
    return (
      <Card>
        <CardContent>
          <p className="text-sm text-muted-foreground">{uiT("ui.4afd8bd35a61281d")}</p>
        </CardContent>
      </Card>
    );
  }

  if (vectorStores.length === 0) {
    return (
      <Card>
        <CardContent>
          <div className="py-8 text-center">
            <p className="text-sm text-muted-foreground">{uiT("ui.11b89442a7039a7a")}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-4">
          <div>
            <h5 className="text-base font-medium text-foreground">{uiT("ui.bc3c0b16aa7dba5d")}</h5>
            <p className="text-sm text-muted-foreground">{uiT("ui.d74ba06ff2ca9e93")}</p>
          </div>

          <Combobox
            items={vectorStores}
            value={selectedVectorStore}
            onValueChange={setSelectedVectorStore}
            itemToStringLabel={storeLabel}
          >
            <ComboboxInput className="w-full" placeholder={uiT("ui.e9950becdb753a89")} />
            <ComboboxContent>
              <ComboboxEmpty>{uiT("ui.804496572b647b74")}</ComboboxEmpty>
              <ComboboxList>
                {(store: VectorStore) => (
                  <ComboboxItem key={store.vector_store_id} value={store}>
                    <div className="flex flex-col">
                      <span className="font-medium">{storeLabel(store)}</span>
                      {store.vector_store_name && (
                        <span className="font-mono text-xs text-muted-foreground">{store.vector_store_id}</span>
                      )}
                    </div>
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </CardContent>
      </Card>

      {selectedVectorStore && (
        <VectorStoreTester vectorStoreId={selectedVectorStore.vector_store_id} accessToken={accessToken} />
      )}
    </div>
  );
};

export default TestVectorStoreTab;
