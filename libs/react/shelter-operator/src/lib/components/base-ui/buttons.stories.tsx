import type { Meta, StoryObj } from '@storybook/react';
import { ArrowRight, Pencil, Plus, Trash2 } from 'lucide-react';
import { ReactNode, useState } from 'react';
import {
  MemoryRouter,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import { Button, ButtonVariant } from './buttons';

const meta: Meta<typeof Button> = {
  component: Button,
  title: 'Base UI/Button',
};
export default meta;

type Story = StoryObj<typeof Button>;

const iconStory = (variant: ButtonVariant, icon: ReactNode): Story => ({
  render: () => <Button variant={variant} leftIcon={icon} rightIcon={null} />,
});

// ARROW

export const RightArrow = iconStory(
  'right-arrow',
  <ArrowRight size={24} stroke="black" />
);

// EDIT ICONS

export const EditLight = iconStory(
  'edit-light',
  <Pencil size={22} stroke="black" />
);

export const EditGhost = iconStory(
  'edit-light',
  <Pencil size={22} stroke="#747A82" />
);

export const EditMedium = iconStory(
  'edit-medium',
  <Pencil size={22} stroke="black" />
);

export const EditDark = iconStory(
  'edit-dark',
  <Pencil size={22} stroke="black" />
);

// TRASH BUTTONS

export const TrashLight = iconStory(
  'trash-light',
  <Trash2 size={22} stroke="#CB0808" />
);

export const TrashGhost = iconStory(
  'trash-light',
  <Trash2 size={22} stroke="#747A82" />
);

export const TrashMedium = iconStory(
  'trash-medium',
  <Trash2 size={22} stroke="#CB0808" />
);

export const TrashDark = iconStory(
  'trash-dark',
  <Trash2 size={22} stroke="#CB0808" />
);

// SMALL BUTTONS

export const SmallLight: Story = {
  parameters: {
    customLayout: {
      canvasClassName: 'flex flex-col items-center justify-center w-fit h-fit',
    },
  },
  render: () => <Button variant="small-light">Button</Button>,
};

export const SmallMedium: Story = {
  parameters: {
    customLayout: {
      canvasClassName: 'flex flex-col items-center justify-center w-fit h-fit',
    },
  },
  render: () => <Button variant="small-medium">Button</Button>,
};

export const SmallDark: Story = {
  parameters: {
    customLayout: {
      canvasClassName: 'flex flex-col items-center justify-center w-fit h-fit',
    },
  },
  render: () => <Button variant="small-dark">Button</Button>,
};

// FLOATING BUTTONS

export const FloatingLight: Story = {
  parameters: {
    customLayout: {
      canvasClassName: 'flex flex-col items-center w-fit h-fit',
    },
  },
  render: () => <Button variant="floating-light">Button</Button>,
};

export const FloatingDark: Story = {
  parameters: {
    customLayout: {
      canvasClassName: 'flex flex-col items-center w-fit h-fit',
    },
  },
  render: () => <Button variant="floating-dark">Button</Button>,
};

// PLAYGROUND

export const Playground: Story = {
  render: (args: typeof meta.args) => (
    <Button
      {...args}
      leftIcon={args?.leftIcon ? <Plus /> : undefined}
      rightIcon={args?.rightIcon ? <Plus /> : undefined}
    />
  ),
  args: {
    variant: 'floating-light',
    children: 'Button',
    leftIcon: false,
    rightIcon: false,
  },
};

function ClickHandlerDemo() {
  const [count, setCount] = useState(0);

  return (
    <Button
      variant="floating-light"
      leftIcon={false}
      rightIcon={<Plus />}
      onClick={() => setCount((current) => current + 1)}
    >
      Clicked {count}
    </Button>
  );
}

export const ClickHandler: Story = {
  render: () => <ClickHandlerDemo />,
};

function NavigateButtonDemo() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="flex flex-col items-center gap-3">
      <Button
        variant="floating-light"
        leftIcon={false}
        rightIcon={<Plus />}
        onClick={() => navigate('/operator/dashboard/create')}
      >
        Go to Create Shelter
      </Button>
      <p className="text-sm text-gray-500">Path: {location.pathname}</p>
    </div>
  );
}

export const NavigateHandler: Story = {
  render: () => (
    <MemoryRouter initialEntries={['/operator/dashboard']}>
      <Routes>
        <Route path="*" element={<NavigateButtonDemo />} />
      </Routes>
    </MemoryRouter>
  ),
};
