# Step-by-Step Tutorial: Adding a New Feature

In this tutorial, we'll walk through adding a complete new feature called **Products** to the dashboard. This will cover everything from creating the database schema to displaying data in the UI.

## What We're Building

By the end of this tutorial, you'll have:
- A new Products management page
- A data table showing all products
- Ability to create new products via a dialog
- Ability to delete products
- Full TypeScript type safety
- Proper error handling and user feedback

## Prerequisites

- Node.js and pnpm installed
- Basic understanding of React and TypeScript
- Supabase account and project set up
- Development server running (`pnpm run dev`)

---

## Part 1: Database Setup (Supabase)

### Step 1.1: Create Products Table

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **SQL Editor**
4. Create a new query and run:

```sql
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

### Step 1.2: Enable Row Level Security (RLS)

1. Go to **Authentication > Policies**
2. Select the `products` table
3. Click **Enable RLS**
4. Create a policy for authenticated users:

```sql
CREATE POLICY "Enable read access for authenticated users"
ON products FOR SELECT
USING (auth.role() = 'authenticated_user');

CREATE POLICY "Enable insert for authenticated users"
ON products FOR INSERT
WITH CHECK (auth.role() = 'authenticated_user');

CREATE POLICY "Enable delete for authenticated users"
ON products FOR DELETE
USING (auth.role() = 'authenticated_user');
```

### Step 1.3: Add Sample Data

Go to **Table Editor > products** and add a few test records:
- Product 1: "Laptop", price: 999.99, status: "active"
- Product 2: "Mouse", price: 29.99, status: "active"
- Product 3: "Keyboard", price: 79.99, status: "inactive"

---

## Part 2: Create Feature Structure

### Step 2.1: Create Feature Directory

Open terminal and run:

```bash
mkdir -p src/features/products
mkdir -p src/features/products/components
mkdir -p src/features/products/hooks
mkdir -p src/features/products/data
```

Your directory structure should now look like:
```
src/features/products/
├── components/
├── hooks/
├── data/
└── (files will be created next)
```

---

## Part 3: Define Data Schema

### Step 3.1: Create schema.ts

Create file: `src/features/products/data/schema.ts`

```typescript
import { z } from 'zod'

// Database schema - represents data from Supabase
export const productSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Product name is required'),
  description: z.string().nullable(),
  price: z.number().positive('Price must be greater than 0'),
  status: z.enum(['active', 'inactive']),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
})

export type Product = z.infer<typeof productSchema>

// Form schema - for creating new products
export const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required').min(3, 'Name must be at least 3 characters'),
  description: z.string().optional(),
  price: z.number().positive('Price must be greater than 0'),
  status: z.enum(['active', 'inactive']),
})

export type CreateProductForm = z.infer<typeof createProductSchema>
```

---

## Part 4: Create Custom Hook for Data Fetching

### Step 4.1: Create useProducts Hook

Create file: `src/features/products/hooks/use-products.ts`

```typescript
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Product, CreateProductForm } from '../data/schema'

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch all products from Supabase
  const fetchProducts = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      setProducts(data || [])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch products'
      setError(message)
      console.error('Fetch error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Fetch products when component mounts
  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  // Create a new product
  const createProduct = async (formData: CreateProductForm) => {
    try {
      const { data, error: createError } = await supabase
        .from('products')
        .insert([formData])
        .select()
        .single()

      if (createError) throw createError

      // Refresh the products list
      await fetchProducts()
      return data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create product'
      console.error('Create error:', err)
      throw new Error(message)
    }
  }

  // Delete a product
  const deleteProduct = async (productId: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId)

      if (error) throw error

      // Refresh the products list
      await fetchProducts()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete product'
      console.error('Delete error:', err)
      throw new Error(message)
    }
  }

  return {
    products,
    isLoading,
    error,
    createProduct,
    deleteProduct,
    refetch: fetchProducts,
  }
}
```

### Step 4.2: Create Hook Export File

Create file: `src/features/products/hooks/index.ts`

```typescript
export { useProducts } from './use-products'
```

---

## Part 5: Create UI Components

### Step 5.1: Create Table Columns

Create file: `src/features/products/components/products-columns.tsx`

```typescript
import { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import type { Product } from '../data/schema'
import { DataTableRowActions } from './data-table-row-actions'

export const productsColumns: ColumnDef<Product>[] = [
  {
    accessorKey: 'name',
    header: 'Product Name',
    cell: ({ row }) => (
      <span className="font-medium">{row.getValue('name')}</span>
    ),
  },
  {
    accessorKey: 'description',
    header: 'Description',
    cell: ({ row }) => (
      <span className="max-w-xs truncate text-sm text-muted-foreground">
        {row.getValue('description') || '-'}
      </span>
    ),
  },
  {
    accessorKey: 'price',
    header: 'Price',
    cell: ({ row }) => {
      const price = row.getValue('price') as number
      return <span className="font-medium">${price.toFixed(2)}</span>
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as string
      const variants: Record<string, 'default' | 'secondary' | 'outline'> = {
        active: 'default',
        inactive: 'outline',
      }
      return (
        <Badge variant={variants[status] || 'outline'}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
      )
    },
  },
  {
    accessorKey: 'created_at',
    header: 'Created',
    cell: ({ row }) => {
      const date = new Date(row.getValue('created_at') as string)
      return <span className="text-sm">{date.toLocaleDateString()}</span>
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
]
```

### Step 5.2: Create Row Actions Component

Create file: `src/features/products/components/data-table-row-actions.tsx`

```typescript
import { Row } from '@tanstack/react-table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { MoreHorizontal, Trash2 } from 'lucide-react'
import { useProductDialog } from './products-provider'
import type { Product } from '../data/schema'

interface DataTableRowActionsProps {
  row: Row<Product>
}

export function DataTableRowActions({ row }: DataTableRowActionsProps) {
  const { setSelectedProduct, onDeleteDialogOpen } = useProductDialog()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => {
            setSelectedProduct(row.original)
            onDeleteDialogOpen(true)
          }}
          className="text-red-600"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

### Step 5.3: Create Provider for Dialog State

Create file: `src/features/products/components/products-provider.tsx`

```typescript
import { createContext, useContext, useState } from 'react'
import type { Product } from '../data/schema'

interface ProductDialogContextType {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  isDeleteDialogOpen: boolean
  onDeleteDialogOpen: (open: boolean) => void
  selectedProduct: Product | null
  setSelectedProduct: (product: Product | null) => void
}

const ProductDialogContext = createContext<ProductDialogContextType | undefined>(
  undefined
)

export function ProductsProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  return (
    <ProductDialogContext.Provider
      value={{
        isOpen,
        onOpenChange: setIsOpen,
        isDeleteDialogOpen,
        onDeleteDialogOpen: setIsDeleteDialogOpen,
        selectedProduct,
        setSelectedProduct,
      }}
    >
      {children}
    </ProductDialogContext.Provider>
  )
}

export function useProductDialog() {
  const context = useContext(ProductDialogContext)
  if (!context) {
    throw new Error('useProductDialog must be used within ProductsProvider')
  }
  return context
}
```

### Step 5.4: Create Add Product Button

Create file: `src/features/products/components/products-primary-buttons.tsx`

```typescript
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useProductDialog } from './products-provider'

export function ProductsPrimaryButtons() {
  const { onOpenChange } = useProductDialog()

  return (
    <Button onClick={() => onOpenChange(true)} size="sm">
      <Plus className="mr-2 h-4 w-4" />
      Add Product
    </Button>
  )
}
```

### Step 5.5: Create Add Product Dialog

Create file: `src/features/products/components/products-action-dialog.tsx`

```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { createProductSchema, type CreateProductForm } from '../data/schema'
import { useProductDialog } from './products-provider'
import { useProducts } from '../hooks'

export function ProductsActionDialog() {
  const { isOpen, onOpenChange } = useProductDialog()
  const { createProduct } = useProducts()
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const form = useForm<CreateProductForm>({
    resolver: zodResolver(createProductSchema),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      status: 'active',
    },
  })

  const onSubmit = async (data: CreateProductForm) => {
    setIsSubmitting(true)
    try {
      await createProduct(data)
      toast.success('Product created successfully!')
      form.reset()
      onOpenChange(false)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to create product'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Product</DialogTitle>
          <DialogDescription>
            Create a new product in your catalog
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Wireless Mouse" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe your product"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Product'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
```

### Step 5.6: Create Delete Product Dialog

Create file: `src/features/products/components/products-delete-dialog.tsx`

```typescript
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useProductDialog } from './products-provider'
import { useProducts } from '../hooks'

export function ProductsDeleteDialog() {
  const { isDeleteDialogOpen, onDeleteDialogOpen, selectedProduct } =
    useProductDialog()
  const { deleteProduct } = useProducts()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!selectedProduct) return

    setIsDeleting(true)
    try {
      await deleteProduct(selectedProduct.id)
      toast.success('Product deleted successfully!')
      onDeleteDialogOpen(false)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete product'
      )
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog open={isDeleteDialogOpen} onOpenChange={onDeleteDialogOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Product</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{selectedProduct?.name}"? This
            action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex gap-2">
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}
```

### Step 5.7: Create Dialogs Manager

Create file: `src/features/products/components/products-dialogs.tsx`

```typescript
import { ProductsActionDialog } from './products-action-dialog'
import { ProductsDeleteDialog } from './products-delete-dialog'

export function ProductsDialogs() {
  return (
    <>
      <ProductsActionDialog />
      <ProductsDeleteDialog />
    </>
  )
}
```

### Step 5.8: Create Products Table Component

Create file: `src/features/products/components/products-table.tsx`

```typescript
import { useEffect, useState } from 'react'
import {
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import type { NavigateFn } from '@/hooks/use-table-url-state'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DataTablePagination } from '@/components/data-table'
import type { Product } from '../data/schema'
import { productsColumns } from './products-columns'

type ProductsTableProps = {
  data: Product[]
  search: Record<string, unknown>
  navigate: NavigateFn
  isLoading?: boolean
}

export function ProductsTable({
  data,
  search,
  navigate,
  isLoading,
}: ProductsTableProps) {
  const [rowSelection, setRowSelection] = useState({})
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [sorting, setSorting] = useState<SortingState>([])
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  })

  const table = useReactTable({
    data,
    columns: productsColumns,
    state: {
      sorting,
      pagination,
      rowSelection,
      columnVisibility,
    },
    enableRowSelection: true,
    onPaginationChange: setPagination,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    getPaginationRowModel: getPaginationRowModel(),
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    colSpan={header.colSpan}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={productsColumns.length}
                  className="h-24 text-center"
                >
                  Loading...
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={productsColumns.length}
                  className="h-24 text-center"
                >
                  No products found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} className="mt-auto" />
    </div>
  )
}
```

### Step 5.9: Create Main Feature Component

Create file: `src/features/products/index.tsx`

```typescript
import React from 'react'
import { getRouteApi } from '@tanstack/react-router'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { ProductsDialogs } from './components/products-dialogs'
import { ProductsPrimaryButtons } from './components/products-primary-buttons'
import { ProductsProvider } from './components/products-provider'
import { ProductsTable } from './components/products-table'
import { useProducts } from './hooks'

const route = getRouteApi('/_authenticated/products/')

export function Products() {
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const { products, isLoading, error } = useProducts()

  return (
    <ProductsProvider>
      <Header fixed>
        <Search />
        <div className="ms-auto flex items-center space-x-4">
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main className="flex flex-1 flex-col gap-4 sm:gap-6">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Products</h2>
            <p className="text-muted-foreground">
              Manage your product catalog here.
            </p>
          </div>
          <ProductsPrimaryButtons />
        </div>

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
            {error}
          </div>
        ) : (
          <ProductsTable
            data={products}
            search={search}
            navigate={navigate}
            isLoading={isLoading}
          />
        )}
      </Main>

      <ProductsDialogs />
    </ProductsProvider>
  )
}
```

---

## Part 6: Create Route

### Step 6.1: Create Route Directory

```bash
mkdir -p src/routes/_authenticated/products
```

### Step 6.2: Create Route File

Create file: `src/routes/_authenticated/products/index.tsx`

```typescript
import { createFileRoute } from '@tanstack/react-router'
import { Products } from '@/features/products'

export const Route = createFileRoute('/_authenticated/products/')({
  component: Products,
})
```

---

## Part 7: Add Navigation Menu Item

### Step 7.1: Update Sidebar

Edit file: `src/components/layout/app-sidebar.tsx`

Find the navigation items array and add this item (usually around line 50-80):

```typescript
import { Package } from 'lucide-react'  // Add this import at the top

// Inside the navItems array, add:
{
  title: 'Products',
  icon: Package,
  href: '/products',
  label: 'New',
},
```

---

## Part 8: Test Your Feature

### Step 8.1: Verify Everything Works

1. **Check sidebar**: Refresh your browser (F5 or Cmd+R)
2. **Click Products menu**: You should see the Products page load
3. **Add a product**: 
   - Click "Add Product" button
   - Fill in the form
   - Click "Create Product"
   - You should see a success toast
   - New product should appear in the table
4. **Delete a product**:
   - Click the three dots (...) on any row
   - Click "Delete"
   - Confirm the deletion
   - Product should disappear from table

### Step 8.2: Fix Common Issues

**Issue: Page shows 404**
- Make sure route file exists: `src/routes/_authenticated/products/index.tsx`
- Restart dev server: `Ctrl+C` then `pnpm run dev`

**Issue: Products not loading**
- Open browser DevTools (F12)
- Go to Network tab
- Look for requests to your Supabase API
- Check if there are any error messages
- Verify Supabase table and RLS policies are set up correctly

**Issue: Form not submitting**
- Check browser console for validation errors
- Verify all form field names match the schema
- Make sure Zod schema is correct

**Issue: Types errors**
- Run: `pnpm tsc` to check TypeScript
- Fix any type mismatches reported

---

## Part 9: Polish & Optimization

### Step 9.1: Run Linter and Formatter

```bash
# Check for code issues
pnpm lint

# Format code
pnpm format
```

### Step 9.2: Add Loading State to Button

Update `src/features/products/components/products-action-dialog.tsx`:

```typescript
import React from 'react'

// Inside ProductsActionDialog component, add:
const [isSubmitting, setIsSubmitting] = React.useState(false)

// Then in onSubmit:
const onSubmit = async (data: CreateProductForm) => {
  setIsSubmitting(true)
  try {
    await createProduct(data)
    toast.success('Product created successfully!')
    form.reset()
    onOpenChange(false)
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'Failed to create product')
  } finally {
    setIsSubmitting(false)
  }
}

// In the button:
<Button type="submit" className="w-full" disabled={isSubmitting}>
  {isSubmitting ? 'Creating...' : 'Create Product'}
</Button>
```

---

## Verification Checklist

- [ ] Sidebar shows "Products" menu item
- [ ] Clicking "Products" navigates to `/products`
- [ ] Page displays correctly
- [ ] Products table shows data from Supabase
- [ ] "Add Product" button opens a dialog
- [ ] Form validates inputs
- [ ] Can create new products
- [ ] New products appear in table immediately
- [ ] Can delete products
- [ ] Delete confirmation dialog works
- [ ] Toast notifications appear on success/error
- [ ] No console errors
- [ ] No TypeScript errors (`pnpm tsc`)
- [ ] Responsive on mobile
- [ ] Dark mode works

---

## What You Learned

Congratulations! You've successfully:

1. ✅ Created a database table in Supabase
2. ✅ Set up Row Level Security policies
3. ✅ Defined TypeScript schemas with Zod
4. ✅ Created a custom React hook for data fetching
5. ✅ Built reusable UI components
6. ✅ Managed dialog state with React Context
7. ✅ Created a data table with sorting and pagination
8. ✅ Implemented CRUD operations (Create, Read, Delete)
9. ✅ Added proper error handling and user feedback
10. ✅ Integrated with the app navigation

---

## Next Steps

Now that you have a working feature, you can:

- Add **edit** functionality (update products)
- Add **filters** (by status, price range, etc.)
- Add **search** functionality
- Add **bulk actions** (delete multiple products)
- Add **export** functionality (CSV, PDF)
- Add **image uploads** for products
- Connect to a **real backend API**

---

## Resources

- 📚 [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md) - Full development guide
- ✅ [IMPLEMENTATION_CHECKLIST.md](./IMPLEMENTATION_CHECKLIST.md) - Troubleshooting guide
- 🔗 [Supabase Docs](https://supabase.com/docs)
- 🎨 [Shadcn UI](https://ui.shadcn.com)
- ⚛️ [React Docs](https://react.dev)

---

Happy coding! 🚀
