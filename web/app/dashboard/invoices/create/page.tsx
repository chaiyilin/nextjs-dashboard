import Form from "@/app/ui/invoices/create-form";
import Breadcrumbs from "@/app/ui/invoices/breadcrumbs";
import { fetchCustomers } from "@/app/lib/data";
import { Suspense } from "react";

async function CreateFormWithData() {
  const customers = await fetchCustomers();
  return <Form customers={customers} />;
}

export default async function Page() {
  return (
    <main>
      <Breadcrumbs
        breadcrumbs={[
          { label: "Invoices", href: "/dashboard/invoices" },
          {
            label: "Create Invoice",
            href: "/dashboard/invoices/create",
            active: true,
          },
        ]}
      />
      <Suspense>
        <CreateFormWithData />
      </Suspense>
    </main>
  );
}
