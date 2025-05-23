import React, { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Id } from '../../../convex/_generated/dataModel';

interface HierarchicalCategory {
  _id: Id<"categories">;
  _creationTime: number;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  parentCategoryId?: Id<"categories">;
  isActive: boolean;
  sortOrder: number;
  children: Array<{
    _id: Id<"categories">;
    _creationTime: number;
    name: string;
    slug: string;
    description?: string;
    imageUrl?: string;
    parentCategoryId?: Id<"categories">;
    isActive: boolean;
    sortOrder: number;
  }>;
}

interface HierarchicalCategoryFilterProps {
  selectedCategoryId?: string;
  onCategorySelect: (categoryId: string | null) => void;
  showCounts?: boolean;
}

const HierarchicalCategoryFilter: React.FC<HierarchicalCategoryFilterProps> = ({
  selectedCategoryId,
  onCategorySelect,
  showCounts = false,
}) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  
  const hierarchicalCategories = useQuery(api.categories.getAllCategoriesHierarchical);

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const handleCategoryClick = (categoryId: string) => {
    onCategorySelect(categoryId === selectedCategoryId ? null : categoryId);
  };

  if (!hierarchicalCategories) {
    return <div className="animate-pulse">Loading categories...</div>;
  }

  return (
    <div className="space-y-2">
      <h3 className="font-semibold text-gray-900 mb-4">Categories</h3>
      
      {/* All Categories Option */}
      <button
        onClick={() => onCategorySelect(null)}
        className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
          !selectedCategoryId
            ? 'bg-stellamaris-100 text-stellamaris-800 font-medium'
            : 'text-gray-700 hover:bg-gray-100'
        }`}
      >
        All Categories
      </button>

      {/* Hierarchical Categories */}
      {hierarchicalCategories.map((parentCategory) => (
        <div key={parentCategory._id} className="space-y-1">
          {/* Parent Category */}
          <div className="flex items-center">
            {parentCategory.children.length > 0 && (
              <button
                onClick={() => toggleCategory(parentCategory._id)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                {expandedCategories.has(parentCategory._id) ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
            )}
            <button
              onClick={() => handleCategoryClick(parentCategory._id)}
              className={`flex-1 text-left px-3 py-2 rounded-md transition-colors ${
                selectedCategoryId === parentCategory._id
                  ? 'bg-stellamaris-100 text-stellamaris-800 font-medium'
                  : 'text-gray-700 hover:bg-gray-100'
              } ${parentCategory.children.length === 0 ? 'ml-6' : ''}`}
            >
              {parentCategory.name}
              {showCounts && (
                <span className="text-sm text-gray-500 ml-2">(0)</span>
              )}
            </button>
          </div>

          {/* Child Categories */}
          {expandedCategories.has(parentCategory._id) && parentCategory.children.length > 0 && (
            <div className="ml-6 space-y-1">
              {parentCategory.children.map((childCategory) => (
                <button
                  key={childCategory._id}
                  onClick={() => handleCategoryClick(childCategory._id)}
                  className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                    selectedCategoryId === childCategory._id
                      ? 'bg-stellamaris-100 text-stellamaris-800 font-medium'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {childCategory.name}
                  {showCounts && (
                    <span className="text-sm text-gray-500 ml-2">(0)</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default HierarchicalCategoryFilter; 