
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Copy, Star } from 'lucide-react';

export const ProjectTemplates = () => {
  const templates = [
    {
      id: '1',
      name: 'Social Media Campaign',
      description: 'Complete social media campaign workflow with content creation, scheduling, and analytics',
      tasks: 15,
      duration: '4 weeks',
      category: 'Marketing',
      popular: true
    },
    {
      id: '2',
      name: 'Brand Identity Project',
      description: 'Full brand identity development including logo, guidelines, and collateral',
      tasks: 22,
      duration: '6 weeks',
      category: 'Design',
      popular: true
    },
    {
      id: '3',
      name: 'Website Launch',
      description: 'Website development and launch process with testing and deployment',
      tasks: 28,
      duration: '8 weeks',
      category: 'Development',
      popular: false
    },
    {
      id: '4',
      name: 'Content Marketing Series',
      description: 'Blog post series with research, writing, and promotion phases',
      tasks: 12,
      duration: '3 weeks',
      category: 'Content',
      popular: false
    },
    {
      id: '5',
      name: 'Product Launch Campaign',
      description: 'End-to-end product launch with PR, marketing, and sales enablement',
      tasks: 35,
      duration: '12 weeks',
      category: 'Marketing',
      popular: true
    },
    {
      id: '6',
      name: 'Email Marketing Automation',
      description: 'Setup and optimization of email marketing funnels and automation',
      tasks: 18,
      duration: '5 weeks',
      category: 'Marketing',
      popular: false
    }
  ];

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Marketing': return 'bg-blue-100 text-blue-800';
      case 'Design': return 'bg-purple-100 text-purple-800';
      case 'Development': return 'bg-green-100 text-green-800';
      case 'Content': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Project Templates</h2>
          <p className="text-gray-600 mt-1">Start new projects faster with pre-built templates</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Create Template
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <Card key={template.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    {template.popular && (
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {template.description}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge className={getCategoryColor(template.category)}>
                  {template.category}
                </Badge>
                {template.popular && (
                  <Badge variant="outline" className="text-yellow-700 border-yellow-300">
                    Popular
                  </Badge>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Tasks:</span>
                  <div className="font-medium">{template.tasks}</div>
                </div>
                <div>
                  <span className="text-gray-500">Duration:</span>
                  <div className="font-medium">{template.duration}</div>
                </div>
              </div>
              
              <div className="flex space-x-2 pt-2">
                <Button className="flex-1">
                  <Plus className="w-4 h-4 mr-2" />
                  Use Template
                </Button>
                <Button variant="outline" size="icon">
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
