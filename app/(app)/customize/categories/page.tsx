
import { CategoriesContent } from "@/components/categories/categories-content";
import { CategoryDialog } from "@/components/categories/category-dialog";


export default function Categories() {
  return (
    <>
        <div className="relative flex items-center justify-end border-b bg-background px-6 py-5 md:px-8">
            <h1 className="absolute left-1/2 -translate-x-1/2 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                Categorias
            </h1>
            <CategoryDialog />
        </div>
        <div className="space-y-6 p-6 md:p-8">    
            <CategoriesContent />
        </div>
    </>
  );
}