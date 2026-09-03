import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Trash2, 
  ChefHat, 
  AlertTriangle, 
  Save, 
  CheckCircle,
  X,
  Utensils,
  Layers
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from '@/lib/utils';
import { apiFetch } from '@/lib/apiFetch';

interface Ingredient {
  stockId: string;
  amount: number;
}

interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  status: string;
  stock: number;
  description?: string;
  image?: string;
  ingredients?: Ingredient[];
}

interface StockItem {
  id: string;
  name: string;
  qty: number;
  unit: string;
  min: number;
  status: string;
  expiry_date?: string;
}

interface RecipeManagementProps {
  menuItems: MenuItem[];
  setMenuItems: React.Dispatch<React.SetStateAction<MenuItem[]>>;
  stockItems: StockItem[];
  searchTerm?: string;
  refreshMenu: () => void;
}

export function RecipeManagement({ menuItems, setMenuItems, stockItems, searchTerm = '', refreshMenu }: RecipeManagementProps) {
  const [selectedMenuId, setSelectedMenuId] = useState<string | null>(null);
  const [localSearchTerm, setLocalSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('Semua');
  const [editingRecipe, setEditingRecipe] = useState<Ingredient[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const effectiveSearchTerm = searchTerm || localSearchTerm;
  
  const mappedStock = stockItems.map(item => ({
    ...item,
    id: String(item.id)
  }));
  
  const selectedMenu = menuItems.find(item => item.id === selectedMenuId);

  // Filter menu items on the left side
  const filteredMenuItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(effectiveSearchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'Semua' || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = ['Semua', 'Makanan', 'Minuman', 'Tambahan'];

  const handleSelectMenu = (menu: MenuItem) => {
    setSelectedMenuId(menu.id);
    setEditingRecipe(menu.ingredients || []);
  };

  const handleAddIngredientRow = () => {
    if (stockItems.length === 0) {
      toast.error("Tidak ada bahan baku yang terdaftar. Tambahkan bahan baku terlebih dahulu di menu Stok.");
      return;
    }
    
    // Find a stock item that isn't already in the recipe, or just pick the first one
    const existingIds = editingRecipe.map(ing => ing.stockId);
    const availableStock = mappedStock.find(s => !existingIds.includes(s.id)) || mappedStock[0];
    
    setEditingRecipe([...editingRecipe, { stockId: String(availableStock.id), amount: 1 }]);
  };

  const handleRemoveIngredientRow = (index: number) => {
    setEditingRecipe(editingRecipe.filter((_, i) => i !== index));
  };

  const handleIngredientChange = (index: number, field: 'stockId' | 'amount', value: string | number) => {
    const updated = [...editingRecipe];
    if (field === 'amount') {
      updated[index] = { ...updated[index], amount: Math.max(0, Number(value) || 0) };
    } else {
      updated[index] = { ...updated[index], stockId: String(value) };
    }
    setEditingRecipe(updated);
  };

  const handleSaveRecipe = async () => {
    if (!selectedMenuId) return;

    // Validation: check for duplicate stock items
    const stockIds = editingRecipe.map(ing => ing.stockId);
    const hasDuplicates = stockIds.some((id, index) => stockIds.indexOf(id) !== index);
    if (hasDuplicates) {
      toast.error("Ada bahan baku ganda dalam resep. Harap gabungkan atau hapus bahan yang sama.");
      return;
    }

    setIsSaving(true);
    try {
      const response = await apiFetch(`/api/menu/${selectedMenuId}/recipe`, {
        method: 'PUT',
        body: JSON.stringify({ ingredients: editingRecipe })
      });

      if (!response.ok) throw new Error('Gagal memperbarui resep di server');
      
      // Update local state
      setMenuItems(prev => prev.map(menu => {
        if (menu.id === selectedMenuId) {
          return { ...menu, ingredients: editingRecipe };
        }
        return menu;
      }));

      toast.success(`Resep untuk ${selectedMenu?.name} berhasil disimpan!`);
      refreshMenu(); // Refresh global state menu dari backend
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan saat menyimpan resep ke server.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-140px)]">
      {/* LEFT PANEL: Menu List (Col 4) */}
      <div className="lg:col-span-4 flex flex-col bg-white rounded-lg border border-neutral-200 overflow-hidden">
        <div className="p-4 border-b border-neutral-100 bg-neutral-50/50 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-neutral-900 text-base flex items-center gap-2">
              <Utensils size={18} className="text-neutral-600" />
              Pilih Menu
            </h3>
            <Badge variant="outline" className="bg-white border-neutral-200 text-neutral-600">
              {filteredMenuItems.length} item
            </Badge>
          </div>
          
            <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <Input 
              placeholder="Cari nama menu..." 
              className="pl-9 bg-white border-neutral-200 text-sm h-9"
              value={effectiveSearchTerm}
              onChange={(e) => setLocalSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-thin">
            {categories.map((cat) => (
              <Button
                key={cat}
                variant="ghost"
                size="sm"
                onClick={() => setCategoryFilter(cat)}
                className={cn(
                  "h-7 text-xs rounded-full px-3 transition-colors",
                  categoryFilter === cat
                    ? "bg-orange-600 text-white font-bold hover:bg-orange-600 hover:text-white"
                    : "text-stone-500 hover:bg-stone-100 hover:text-stone-800"
                )}
              >
                {cat}
              </Button>
            ))}
          </div>
        </div>

        {/* Scrollable list of menus */}
        <div className="flex-1 overflow-y-auto divide-y divide-neutral-100">
          {filteredMenuItems.map((item) => {
            const hasRecipe = item.ingredients && item.ingredients.length > 0;
            const isSelected = item.id === selectedMenuId;

            return (
              <div
                key={item.id}
                onClick={() => handleSelectMenu(item)}
                className={cn(
                  "flex items-center gap-3 p-3.5 cursor-pointer transition-colors hover:bg-neutral-50",
                  isSelected && "bg-neutral-100 hover:bg-neutral-100 border-l-4 border-neutral-900"
                )}
              >
                <div className="w-12 h-12 rounded-md bg-neutral-100 overflow-hidden flex-shrink-0">
                  <img 
                    src={item.image || `https://picsum.photos/seed/${item.id}/120/120`} 
                    alt={item.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${item.id}/120/120`;
                    }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-neutral-900 text-sm truncate">{item.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-neutral-500 font-mono">Rp {item.price.toLocaleString()}</span>
                    <span className="text-neutral-200">•</span>
                    <span className="text-[10px] text-neutral-400">{item.category}</span>
                  </div>
                </div>
                <div>
                  {hasRecipe ? (
                    <Badge className="bg-neutral-100 text-neutral-700 border border-neutral-200 text-[10px] font-medium">
                      {item.ingredients?.length} Bahan
                    </Badge>
                  ) : (
                    <Badge className="bg-neutral-50 text-neutral-400 border border-neutral-200 text-[10px] font-light">
                      Belum Ada
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}

          {filteredMenuItems.length === 0 && (
            <div className="py-20 text-center text-neutral-400 space-y-2">
              <Utensils size={32} className="mx-auto opacity-20" />
              <p className="text-sm">Tidak ada menu ditemukan</p>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PANEL: Recipe Editor (Col 8) */}
      <div className="lg:col-span-8 flex flex-col bg-white rounded-lg border border-neutral-200 overflow-hidden h-full">
        {selectedMenu ? (
          <div className="flex flex-col h-full">
            {/* Header info selected menu */}
            <div className="p-4 border-b border-neutral-100 bg-neutral-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-md bg-neutral-100 overflow-hidden flex-shrink-0 border border-neutral-200">
                  <img 
                    src={selectedMenu.image || `https://picsum.photos/seed/${selectedMenu.id}/120/120`} 
                    alt={selectedMenu.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold text-neutral-900 text-lg leading-tight">{selectedMenu.name}</h2>
                    <Badge variant="outline" className="border-neutral-200 text-neutral-700 bg-neutral-50 font-normal py-0">
                      {selectedMenu.category}
                    </Badge>
                  </div>
                  <p className="text-xs text-neutral-500 mt-1 max-w-md truncate">
                    {selectedMenu.description || 'Tidak ada deskripsi menu.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={handleAddIngredientRow}
                  className="gap-1.5 h-9 text-xs border-neutral-200 hover:bg-neutral-50"
                >
                  <Plus size={15} />
                  Tambah Bahan Baku
                </Button>
                
                <Button 
                  type="button" 
                  onClick={handleSaveRecipe}
                  disabled={isSaving}
                  className="gap-1.5 h-9 text-xs bg-neutral-900 hover:bg-neutral-800 text-white font-semibold"
                >
                  {isSaving ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save size={15} />
                  )}
                  Simpan Resep
                </Button>
              </div>
            </div>

            {/* List Ingredients inside Selected Menu */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {editingRecipe.length > 0 ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-12 gap-2 text-neutral-400 text-[10px] font-bold tracking-wider uppercase px-2">
                    <div className="col-span-6 sm:col-span-7">Bahan Baku</div>
                    <div className="col-span-4 sm:col-span-3">Takaran / Porsi</div>
                    <div className="col-span-2 text-center">Hapus</div>
                  </div>

                  <div className="space-y-3">
                    {editingRecipe.map((ing, idx) => {
                      const currentStock = mappedStock.find(s => String(s.id) === String(ing.stockId));
                      const isOutOfStock = currentStock ? currentStock.qty <= 0 : false;
                      const isExpired = currentStock?.status === 'Kedaluwarsa';
                      const isNearExpiry = currentStock?.status === 'Hampir Kadaluwarsa';
                      
                      return (
                        <div 
                          key={idx} 
                          className={cn(
                            "grid grid-cols-12 gap-2 items-center p-3 rounded-md border bg-white border-neutral-200",
                            isExpired && "border-red-200 bg-red-50/20",
                            isNearExpiry && "border-amber-200 bg-amber-50/20"
                          )}
                        >
                          {/* Dropdown Select Stock Item */}
                          <div className="col-span-6 sm:col-span-7">
                            <select
                              value={String(ing.stockId)}
                              onChange={(e) => handleIngredientChange(idx, 'stockId', e.target.value)}
                              className="h-10 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-700"
                            >
                              <option value="" disabled>Pilih bahan baku...</option>
                              {mappedStock.map(s => (
                                <option key={String(s.id)} value={String(s.id)}>
                                  {s.name} ({s.unit})
                                </option>
                              ))}
                            </select>

                            {/* Warning alert labels below select */}
                            {currentStock && (
                              <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                                <span className="text-[10px] font-medium text-neutral-500 font-mono">
                                  Tersedia: {currentStock.qty} {currentStock.unit}
                                </span>
                                
                                {isOutOfStock && (
                                  <Badge className="bg-red-100 text-red-700 border-none text-[9px] py-0 px-1.5 font-bold">
                                    <AlertTriangle size={8} className="mr-0.5" /> Habis
                                  </Badge>
                                )}
                                
                                {isExpired && (
                                  <Badge className="bg-red-200 text-red-950 border border-red-300 text-[9px] py-0 px-1.5 font-bold animate-pulse">
                                    <AlertTriangle size={8} className="mr-0.5" /> Kedaluwarsa
                                  </Badge>
                                )}

                                {isNearExpiry && (
                                  <Badge className="bg-amber-100 text-amber-950 border border-amber-300 text-[9px] py-0 px-1.5 font-bold">
                                    <AlertTriangle size={8} className="mr-0.5" /> Hampir Kadaluwarsa
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Kuantitas (Amount) */}
                          <div className="col-span-4 sm:col-span-3 flex items-center gap-1.5">
                            <Input 
                              type="number" 
                              step="any"
                              placeholder="0.0"
                              value={ing.amount || ''}
                              className="h-10 text-neutral-700 text-center font-bold bg-white border-neutral-200 font-mono"
                              onChange={(e) => handleIngredientChange(idx, 'amount', e.target.value)}
                            />
                            <span className="text-xs text-neutral-500 font-medium w-8 truncate">
                              {currentStock?.unit || ''}
                            </span>
                          </div>

                          {/* Delete Button */}
                          <div className="col-span-2 flex justify-center">
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="icon" 
                              className="h-9 w-9 text-neutral-400 hover:text-red-500 hover:bg-red-50"
                              onClick={() => handleRemoveIngredientRow(idx)}
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="py-20 text-center border-2 border-dashed border-neutral-200 rounded-md max-w-md mx-auto my-10 bg-neutral-50/30 p-6 space-y-4">
                  <ChefHat size={40} className="mx-auto text-neutral-300" />
                  <div className="space-y-1">
                    <p className="font-semibold text-neutral-700 text-sm">Resep Masih Kosong</p>
                    <p className="text-xs text-neutral-400">
                      Menu ini belum memiliki konfigurasi resep. Klik tombol di bawah untuk menambahkan bahan baku pertama Anda.
                    </p>
                  </div>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={handleAddIngredientRow}
                    className="gap-1.5 mx-auto text-xs border-neutral-200"
                  >
                    <Plus size={14} /> Tambah Bahan
                  </Button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-3 bg-neutral-50/20">
            <div className="w-16 h-16 rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-600 mb-2">
              <ChefHat size={32} />
            </div>
            <h3 className="font-semibold text-neutral-800 text-lg">Kelola Resep Menu Anda</h3>
            <p className="text-neutral-400 text-sm max-w-sm">
              Silakan pilih salah satu menu makanan atau minuman dari panel kiri untuk melihat, mengedit, atau membuat resep bahan bakunya.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
