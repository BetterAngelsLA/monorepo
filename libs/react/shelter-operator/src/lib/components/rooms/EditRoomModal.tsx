import { useState } from 'react';
import { Modal } from '../base-ui/modal/Modal';
import { ModalBody } from '../base-ui/modal/ModalBody';
import { ModalFooter } from '../base-ui/modal/ModalFooter';
import { ModalHeader } from '../base-ui/modal/ModalHeader';
import type { Room } from '../RoomTable';

export type EditRoomModalProps = {
  isOpen: boolean;
  onClose: () => void;
  room?: Room;
  onSave?: (updatedRoom: Room) => void;
};

export function EditRoomModal({
  isOpen,
  onClose,
  room,
  onSave,
}: EditRoomModalProps) {
  const [formData, setFormData] = useState<Room | undefined>(room);

  const handleInputChange = (field: keyof Room, value: unknown) => {
    if (formData) {
      setFormData({
        ...formData,
        [field]: value,
      });
    }
  };

  const handleSave = () => {
    if (formData) {
      onSave?.(formData);
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalHeader onClose={onClose}>
        <h3 className="text-lg font-semibold">Edit "{room?.name || 'Room'}"</h3>
      </ModalHeader>

      <ModalBody className="space-y-6">
        {/* Room Name */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[#383B40]">
            Room Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData?.name || ''}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="Room Name"
            className="rounded-lg border border-[#D3D9E3] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#008CEE]"
          />
        </div>

        {/* Room Status */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-[#383B40]">
              Room Status
            </label>
            <select
              value={formData?.status || 'available'}
              onChange={(e) =>
                handleInputChange('status', e.target.value as Room['status'])
              }
              className="rounded-lg border border-[#D3D9E3] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#008CEE]"
            >
              <option value="available">Available</option>
              <option value="occupied">Occupied</option>
              <option value="out-of-service">Out of Service</option>
              <option value="reserved">Reserved</option>
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-[#383B40]">
              Status Notes
            </label>
            <textarea
              placeholder="Lorem ipsum dolor sit amet..."
              className="rounded-lg border border-[#D3D9E3] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#008CEE] resize-none"
              rows={3}
            />
          </div>
        </div>

        {/* List of Beds */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[#383B40]">
            List of Beds
          </label>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-[#E8F2FF] px-3 py-1 text-xs font-medium text-[#008CEE]">
              Bed 1
            </span>
            <span className="rounded-full bg-[#F0F0F0] px-3 py-1 text-xs text-[#747A82]">
              Bed 2
            </span>
          </div>
        </div>

        {/* List of Occupants */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[#383B40]">
            List of Occupants
          </label>
          <select
            multiple
            className="rounded-lg border border-[#D3D9E3] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#008CEE]"
          >
            <option>Jane Doe</option>
            <option>John Appleseed</option>
          </select>
        </div>

        {/* Room Type */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[#383B40]">
            Room Type
          </label>
          <select className="rounded-lg border border-[#D3D9E3] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#008CEE]">
            <option>Single-Occupancy</option>
            <option>Double-Occupancy</option>
            <option>Multi-Occupancy</option>
          </select>
        </div>

        {/* Demographics */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[#383B40]">
            Demographics
          </label>
          <select className="rounded-lg border border-[#D3D9E3] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#008CEE]">
            <option>Single Men</option>
            <option>Single Women</option>
            <option>Families</option>
            <option>Mixed</option>
          </select>
        </div>

        {/* Amenities */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[#383B40]">
            Amenities
          </label>
          <select
            multiple
            className="rounded-lg border border-[#D3D9E3] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#008CEE]"
          >
            <option>Private Bathroom</option>
            <option>Air Conditioning</option>
            <option>Heating</option>
            <option>Window</option>
          </select>
        </div>

        {/* Funders */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[#383B40]">Funders</label>
          <select className="rounded-lg border border-[#D3D9E3] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#008CEE]">
            <option>City of Los Angeles</option>
            <option>County</option>
            <option>State</option>
            <option>Private</option>
          </select>
        </div>

        {/* Pets */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[#383B40]">Pets</label>
          <select
            multiple
            className="rounded-lg border border-[#D3D9E3] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#008CEE]"
          >
            <option>Service Animals</option>
            <option>Emotional Support Animals</option>
            <option>No Pets</option>
          </select>
        </div>

        {/* Feature Flags */}
        <div className="grid grid-cols-3 gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-[#383B40]">
              Storage
            </label>
            <div className="flex gap-2">
              {['Yes', 'Unknown', 'No'].map((option) => (
                <button
                  key={option}
                  className="flex-1 rounded-lg border border-[#D3D9E3] px-2 py-1 text-xs font-medium text-[#747A82] hover:bg-[#F4F6FD]"
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-[#383B40]">
              Maintenance Flag
            </label>
            <div className="flex gap-2">
              {['Yes', 'Unknown', 'No'].map((option) => (
                <button
                  key={option}
                  className="flex-1 rounded-lg border border-[#D3D9E3] px-2 py-1 text-xs font-medium text-[#747A82] hover:bg-[#F4F6FD]"
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-[#383B40]">
              Medical Respite
            </label>
            <div className="flex gap-2">
              {['Yes', 'Unknown', 'No'].map((option) => (
                <button
                  key={option}
                  className="flex-1 rounded-lg border border-[#D3D9E3] px-2 py-1 text-xs font-medium text-[#747A82] hover:bg-[#F4F6FD]"
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Last Cleaned/Inspected */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-[#383B40]">
            Last Cleaned/Inspected
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="00"
              maxLength={2}
              className="w-12 rounded-lg border border-[#D3D9E3] px-2 py-2 text-center text-sm focus:outline-none focus:ring-2 focus:ring-[#008CEE]"
            />
            <span className="flex items-center text-[#747A82]">:</span>
            <input
              type="number"
              placeholder="00"
              maxLength={2}
              className="w-12 rounded-lg border border-[#D3D9E3] px-2 py-2 text-center text-sm focus:outline-none focus:ring-2 focus:ring-[#008CEE]"
            />
            <select className="rounded-lg border border-[#D3D9E3] px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#008CEE]">
              <option>AM</option>
              <option>PM</option>
            </select>
          </div>
        </div>
      </ModalBody>

      <ModalFooter>
        <button
          onClick={onClose}
          className="px-5 py-2 rounded-lg text-sm font-medium border border-[#D3D9E3] text-[#383B40] hover:bg-[#F4F6FD]"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="px-5 py-2 rounded-lg text-sm font-medium text-white bg-[#008CEE] hover:bg-[#0374c4]"
        >
          Save
        </button>
      </ModalFooter>
    </Modal>
  );
}
